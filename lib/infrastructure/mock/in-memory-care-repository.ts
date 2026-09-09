import type {
  Appointment,
  CareClaim,
  CareCircle,
  CareDocument,
  CareInvite,
  CareLog,
  CareMember,
  CarePermissions,
  CareProfile,
  CareRole,
  CareTask,
  EventAction,
  Medication,
  MedicationSchedule,
  ProfileStatus,
  VitalReading,
} from "@/lib/domain/care"
import { adminPermissions } from "@/lib/domain/care"
import type { CareSnapshot } from "@/lib/domain/care-snapshot"
import type { CareRepository } from "@/lib/domain/care-repository"
import type { ListParams, PaginatedResult } from "@/lib/domain/pagination"
import { buildTimeline, nextId } from "@/lib/application/care-format"

function paginate<T>(items: T[], params?: ListParams): PaginatedResult<T> {
  const page = params?.page ?? 1
  const perPage = params?.perPage ?? 20
  const start = (page - 1) * perPage
  const data = items.slice(start, start + perPage)
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  return {
    data,
    total,
    page,
    perPage,
    totalPages,
    hasMore: page < totalPages,
  }
}

export class InMemoryCareRepository implements CareRepository {
  private snapshot: CareSnapshot

  constructor(initial: CareSnapshot) {
    this.snapshot = structuredClone(initial)
  }

  async getSnapshot(profileId?: string) {
    if (!profileId) {
      return structuredClone(this.snapshot)
    }
    const clone = structuredClone(this.snapshot)
    const filterByProfile = <T extends { profileId: string }>(items: T[]) =>
      items.filter((item) => item.profileId === profileId)
    return {
      ...clone,
      members: filterByProfile(clone.members),
      invites: filterByProfile(clone.invites),
      claims: filterByProfile(clone.claims),
      logs: filterByProfile(clone.logs),
      medications: filterByProfile(clone.medications),
      events: filterByProfile(clone.events),
      appointments: filterByProfile(clone.appointments),
      tasks: filterByProfile(clone.tasks),
      vitals: filterByProfile(clone.vitals),
      documents: filterByProfile(clone.documents),
    }
  }

  async createProfile(input: {
    displayName: string
    relation?: string
    dateOfBirth?: string
    notes?: string
    status?: ProfileStatus
  }) {
    const profile: CareProfile = {
      id: nextId("cp"),
      displayName: input.displayName,
      relation: input.relation ?? "",
      dateOfBirth: input.dateOfBirth ?? "",
      notes: input.notes,
      role: "guardian_admin",
      permissions: adminPermissions(),
      status: input.status ?? "active",
    }
    this.snapshot.profiles.unshift(profile)
    return profile
  }

  async updateProfile(id: string, patch: Partial<CareProfile>) {
    const profile = this.snapshot.profiles.find((item) => item.id === id)
    if (!profile) {
      throw new Error("Profil tidak dijumpai.")
    }
    Object.assign(profile, patch)
    return { ...profile }
  }

  async archiveProfile(id: string) {
    await this.updateProfile(id, { status: "archived" })
  }

  async createCircle(input: Omit<CareCircle, "id" | "profileIds" | "archived">) {
    const circle: CareCircle = {
      id: nextId("circle"),
      profileIds: [],
      ...input,
    }
    this.snapshot.circles.unshift(circle)
    return circle
  }

  async updateCircle(id: string, patch: Partial<CareCircle>) {
    const circle = this.snapshot.circles.find((item) => item.id === id)
    if (!circle) {
      throw new Error("Lingkaran tidak dijumpai.")
    }
    Object.assign(circle, patch)
    return { ...circle }
  }

  async archiveCircle(id: string) {
    await this.updateCircle(id, { archived: true })
  }

  async linkProfileToCircle(profileId: string, circleId: string) {
    const profile = this.snapshot.profiles.find((item) => item.id === profileId)
    if (profile) {
      profile.circleId = circleId
    }
    for (const circle of this.snapshot.circles) {
      circle.profileIds = circle.profileIds.filter((item) => item !== profileId)
      if (circle.id === circleId && !circle.profileIds.includes(profileId)) {
        circle.profileIds.push(profileId)
      }
    }
  }

  async inviteMember(profileId: string, email: string, role: CareRole) {
    const invite: CareInvite = {
      id: nextId("inv"),
      profileId,
      email,
      role,
      status: "pending",
      token: nextId("invite"),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    }
    this.snapshot.invites.unshift(invite)
    return invite
  }

  async revokeInvite(_profileId: string, inviteId: string) {
    const invite = this.snapshot.invites.find((item) => item.id === inviteId)
    if (invite) {
      invite.status = "revoked"
    }
  }

  async acceptInvite(token: string) {
    const invite = this.snapshot.invites.find(
      (item) => item.token === token && item.status === "pending"
    )
    if (!invite) {
      throw new Error("Jemputan tidak sah.")
    }
    invite.status = "accepted"
    return invite.profileId
  }

  async createClaim(profileId: string, email: string) {
    const claim: CareClaim = {
      id: nextId("claim"),
      profileId,
      email,
      status: "pending",
      token: nextId("claimtok"),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    }
    this.snapshot.claims.unshift(claim)
    return claim
  }

  async revokeClaim(_profileId: string, claimId: string) {
    const claim = this.snapshot.claims.find((item) => item.id === claimId)
    if (claim) {
      claim.status = "revoked"
    }
  }

  async acceptClaim(token: string) {
    const claim = this.snapshot.claims.find(
      (item) => item.token === token && item.status === "pending"
    )
    if (!claim) {
      throw new Error("Tuntutan tidak sah.")
    }
    claim.status = "accepted"
    return claim.profileId
  }

  async listProfileAccess(profileId: string) {
    return this.snapshot.members.filter((item) => item.profileId === profileId)
  }

  async updateMemberRole(
    profileId: string,
    userId: string,
    role: CareRole,
    permissions?: CarePermissions
  ) {
    const members = this.snapshot.members.filter(
      (item) => item.profileId === profileId
    )
    const member = members.find((item) => item.userId === userId)
    if (member) {
      member.role = role
      if (permissions) {
        member.permissions = permissions
      }
    }
    return members
  }

  async removeMember(profileId: string, userId: string) {
    this.snapshot.members = this.snapshot.members.filter(
      (item) => !(item.profileId === profileId && item.userId === userId)
    )
    return this.snapshot.members.filter((item) => item.profileId === profileId)
  }

  async listCareLogs(profileId: string, params?: ListParams) {
    return paginate(
      this.snapshot.logs.filter((item) => item.profileId === profileId),
      params
    )
  }

  async createCareLog(
    profileId: string,
    input: Omit<CareLog, "id" | "profileId">
  ) {
    const log: CareLog = { id: nextId("log"), profileId, ...input }
    this.snapshot.logs.unshift(log)
    return log
  }

  async updateCareLog(
    profileId: string,
    logId: string,
    input: Partial<CareLog>
  ) {
    const log = this.snapshot.logs.find(
      (item) => item.id === logId && item.profileId === profileId
    )
    if (!log) {
      throw new Error("Log tidak dijumpai.")
    }
    Object.assign(log, input)
    return { ...log }
  }

  async deleteCareLog(profileId: string, logId: string) {
    this.snapshot.logs = this.snapshot.logs.filter(
      (item) => !(item.id === logId && item.profileId === profileId)
    )
  }

  async listTimeline(profileId: string, params?: ListParams) {
    return paginate(buildTimeline(this.snapshot, profileId), params)
  }

  async listMedications(profileId: string, params?: ListParams) {
    return paginate(
      this.snapshot.medications.filter((item) => item.profileId === profileId),
      params
    )
  }

  async createMedication(
    profileId: string,
    input: Omit<Medication, "id" | "profileId">
  ) {
    const medication = { id: nextId("med"), profileId, ...input }
    this.snapshot.medications.unshift(medication)
    return medication
  }

  async updateMedication(
    profileId: string,
    medicationId: string,
    patch: Partial<Medication>
  ) {
    const medication = this.snapshot.medications.find(
      (item) => item.id === medicationId && item.profileId === profileId
    )
    if (!medication) {
      throw new Error("Ubat tidak dijumpai.")
    }
    Object.assign(medication, patch)
    return { ...medication }
  }

  async deleteMedication(profileId: string, medicationId: string) {
    this.snapshot.medications = this.snapshot.medications.filter(
      (item) => !(item.id === medicationId && item.profileId === profileId)
    )
  }

  async createSchedule(
    _profileId: string,
    medicationId: string,
    input: Omit<MedicationSchedule, "id">
  ) {
    const schedule: MedicationSchedule = { ...input, id: nextId("sch") }
    this.snapshot.schedules.unshift(schedule)
    return schedule
  }

  async updateSchedule(
    _profileId: string,
    medicationId: string,
    scheduleId: string,
    patch: Partial<MedicationSchedule>
  ) {
    const schedule = this.snapshot.schedules.find(
      (item) => item.id === scheduleId && item.medicationId === medicationId
    )
    if (!schedule) {
      throw new Error("Jadual tidak dijumpai.")
    }
    Object.assign(schedule, patch)
    return { ...schedule }
  }

  async deleteSchedule(
    _profileId: string,
    medicationId: string,
    scheduleId: string
  ) {
    this.snapshot.schedules = this.snapshot.schedules.filter(
      (item) => !(item.id === scheduleId && item.medicationId === medicationId)
    )
  }

  async actOnEvent(
    _profileId: string,
    eventId: string,
    action: EventAction,
    note?: string
  ) {
    const event = this.snapshot.events.find((item) => item.id === eventId)
    if (event) {
      event.actionStatus = action
      event.note = note
    }
  }

  async listAppointments(profileId: string, params?: ListParams) {
    return paginate(
      this.snapshot.appointments.filter((item) => item.profileId === profileId),
      params
    )
  }

  async createAppointment(
    profileId: string,
    input: Omit<Appointment, "id" | "profileId">
  ) {
    const appointment = { id: nextId("apt"), profileId, ...input }
    this.snapshot.appointments.unshift(appointment)
    return appointment
  }

  async updateAppointment(
    profileId: string,
    appointmentId: string,
    patch: Partial<Appointment>
  ) {
    const appointment = this.snapshot.appointments.find(
      (item) => item.id === appointmentId && item.profileId === profileId
    )
    if (!appointment) {
      throw new Error("Temujanji tidak dijumpai.")
    }
    Object.assign(appointment, patch)
    return { ...appointment }
  }

  async deleteAppointment(profileId: string, appointmentId: string) {
    this.snapshot.appointments = this.snapshot.appointments.filter(
      (item) => !(item.id === appointmentId && item.profileId === profileId)
    )
  }

  async listTasks(profileId: string, params?: ListParams) {
    return paginate(
      this.snapshot.tasks.filter((item) => item.profileId === profileId),
      params
    )
  }

  async createTask(
    profileId: string,
    input: Omit<CareTask, "id" | "profileId">
  ) {
    const task = { id: nextId("task"), profileId, ...input }
    this.snapshot.tasks.unshift(task)
    return task
  }

  async updateTask(
    profileId: string,
    taskId: string,
    patch: Partial<CareTask>
  ) {
    const task = this.snapshot.tasks.find(
      (item) => item.id === taskId && item.profileId === profileId
    )
    if (!task) {
      throw new Error("Tugasan tidak dijumpai.")
    }
    Object.assign(task, patch)
    return { ...task }
  }

  async deleteTask(profileId: string, taskId: string) {
    this.snapshot.tasks = this.snapshot.tasks.filter(
      (item) => !(item.id === taskId && item.profileId === profileId)
    )
  }

  async listVitals(profileId: string, params?: ListParams) {
    return paginate(
      this.snapshot.vitals.filter((item) => item.profileId === profileId),
      params
    )
  }

  async createVital(
    profileId: string,
    input: Omit<VitalReading, "id" | "profileId">
  ) {
    const vital = { id: nextId("vit"), profileId, ...input }
    this.snapshot.vitals.unshift(vital)
    return vital
  }

  async updateVital(
    profileId: string,
    readingId: string,
    patch: Partial<VitalReading>
  ) {
    const vital = this.snapshot.vitals.find(
      (item) => item.id === readingId && item.profileId === profileId
    )
    if (!vital) {
      throw new Error("Bacaan vital tidak dijumpai.")
    }
    Object.assign(vital, patch)
    return { ...vital }
  }

  async deleteVital(profileId: string, readingId: string) {
    this.snapshot.vitals = this.snapshot.vitals.filter(
      (item) => !(item.id === readingId && item.profileId === profileId)
    )
  }

  async listDocuments(profileId: string, params?: ListParams) {
    return paginate(
      this.snapshot.documents.filter((item) => item.profileId === profileId),
      params
    )
  }

  async createDocument(
    profileId: string,
    input: Omit<
      CareDocument,
      "id" | "profileId" | "uploadState" | "uploadProgress"
    >
  ) {
    const document: CareDocument = {
      id: nextId("doc"),
      profileId,
      uploadState: "done",
      uploadProgress: 100,
      ...input,
    }
    this.snapshot.documents.unshift(document)
    return document
  }

  async updateDocument(
    profileId: string,
    documentId: string,
    patch: Partial<CareDocument>
  ) {
    const document = this.snapshot.documents.find(
      (item) => item.id === documentId && item.profileId === profileId
    )
    if (!document) {
      throw new Error("Dokumen tidak dijumpai.")
    }
    Object.assign(document, patch)
    return { ...document }
  }

  async deleteDocument(profileId: string, documentId: string) {
    this.snapshot.documents = this.snapshot.documents.filter(
      (item) => !(item.id === documentId && item.profileId === profileId)
    )
  }

  async uploadDocument(
    profileId: string,
    file: File,
    input: {
      title: string
      documentType: CareDocument["documentType"]
      issueDate?: string
      expiryDate?: string
      notes?: string
    }
  ) {
    return this.createDocument(profileId, {
      title: input.title,
      documentType: input.documentType,
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      issueDate: input.issueDate,
      expiryDate: input.expiryDate,
      notes: input.notes,
      createdAt: new Date().toISOString(),
    })
  }

  async getDocumentDownloadUrl(_profileId: string, _documentId: string) {
    return {
      url: "#",
      filename: "demo.pdf",
    }
  }
}
