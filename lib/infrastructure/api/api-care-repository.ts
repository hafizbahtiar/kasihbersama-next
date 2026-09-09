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
  VitalReading,
} from "@/lib/domain/care"
import type { CareSnapshot } from "@/lib/domain/care-snapshot"
import { emptyCareSnapshot as createEmptySnapshot } from "@/lib/domain/care-snapshot"
import type { CareRepository } from "@/lib/domain/care-repository"
import type { ListParams, PaginatedResult } from "@/lib/domain/pagination"
import type { ApiClient } from "@/lib/infrastructure/api/client"
import { ApiError } from "@/lib/infrastructure/api/errors"
import {
  mapAppointment,
  mapCareLog,
  mapCareTask,
  mapCircle,
  mapClaim,
  mapDocument,
  mapInvite,
  mapMedication,
  mapMedicationEvent,
  mapMember,
  mapPaginated,
  mapProfile,
  mapSchedule,
  mapTimelineItem,
  mapVitalReading,
  toListQuery,
  type ApiAppointment,
  type ApiCareLog,
  type ApiCareTask,
  type ApiCircle,
  type ApiClaim,
  type ApiDocument,
  type ApiInvite,
  type ApiMedication,
  type ApiMedicationEvent,
  type ApiMedicationSchedule,
  type ApiMember,
  type ApiProfile,
  type ApiVitalReading,
} from "@/lib/infrastructure/api/mappers/care"

type ApiAccessReview = {
  care_profile_id: string
  members: ApiMember[]
}

function mapAccessMembers(review: ApiAccessReview, profileId: string) {
  return review.members.map((item) => mapMember(item, profileId))
}
import type { PaginatedResponse, AcceptMembershipResponse } from "@/lib/infrastructure/api/types"

const DEFAULT_PAGE_SIZE = 100

function profilePath(profileId: string) {
  return `/care-profiles/${profileId}`
}

export class ApiCareRepository implements CareRepository {
  constructor(private readonly client: ApiClient) {}

  async getSnapshot(profileId?: string): Promise<CareSnapshot> {
    const [profiles, circles] = await Promise.all([
      this.client.request<ApiProfile[]>("/care-profiles"),
      this.client.request<ApiCircle[]>("/care-circles"),
    ])

    const mappedProfiles = profiles.map(mapProfile)
    const mappedCircles = circles.map(mapCircle)
    const activeProfileId =
      profileId ??
      mappedProfiles.find((item) => item.status === "active")?.id ??
      mappedProfiles[0]?.id

    if (!activeProfileId) {
      return {
        ...createEmptySnapshot(),
        profiles: mappedProfiles,
        circles: mappedCircles,
      }
    }

    const profileData = await this.loadProfileData(activeProfileId)
    return {
      profiles: mappedProfiles,
      circles: mappedCircles,
      ...profileData,
    }
  }

  private async loadProfileData(profileId: string) {
    const base = profilePath(profileId)
    const [
      membersResp,
      invites,
      claims,
      logs,
      medications,
      events,
      appointments,
      tasks,
      vitals,
      documents,
    ] = await Promise.all([
      this.client.request<ApiAccessReview>(`${base}/members`),
      this.client.request<ApiInvite[]>(`${base}/invites`),
      this.client.request<ApiClaim[]>(`${base}/claim-requests`),
      this.client.request<PaginatedResponse<ApiCareLog>>(
        `${base}/care-logs${toListQuery({ perPage: DEFAULT_PAGE_SIZE })}`
      ),
      this.client.request<PaginatedResponse<ApiMedication>>(
        `${base}/medications${toListQuery({ perPage: DEFAULT_PAGE_SIZE })}`
      ),
      this.client.request<PaginatedResponse<ApiMedicationEvent>>(
        `${base}/medication-events${toListQuery({ perPage: DEFAULT_PAGE_SIZE })}`
      ),
      this.client.request<PaginatedResponse<ApiAppointment>>(
        `${base}/appointments${toListQuery({ perPage: DEFAULT_PAGE_SIZE })}`
      ),
      this.client.request<PaginatedResponse<ApiCareTask>>(
        `${base}/care-tasks${toListQuery({ perPage: DEFAULT_PAGE_SIZE })}`
      ),
      this.client.request<PaginatedResponse<ApiVitalReading>>(
        `${base}/vital-readings${toListQuery({ perPage: DEFAULT_PAGE_SIZE })}`
      ),
      this.client.request<PaginatedResponse<ApiDocument>>(
        `${base}/documents${toListQuery({ perPage: DEFAULT_PAGE_SIZE })}`
      ),
    ])

    const mappedMedications = medications.data.map((item) =>
      mapMedication(item, profileId)
    )
    const scheduleGroups = await Promise.all(
      mappedMedications.map(async (medication) => {
        const rows = await this.client.request<ApiMedicationSchedule[]>(
          `${base}/medications/${medication.id}/schedules`
        )
        return rows.map(mapSchedule)
      })
    )

    return {
      members: membersResp.members.map((item) => mapMember(item, profileId)),
      invites: invites.map((item) => mapInvite(item, profileId)),
      claims: claims.map((item) => mapClaim(item, profileId)),
      logs: logs.data.map((item) => mapCareLog(item, profileId)),
      medications: mappedMedications,
      schedules: scheduleGroups.flat(),
      events: events.data.map((item) => mapMedicationEvent(item, profileId)),
      appointments: appointments.data.map((item) =>
        mapAppointment(item, profileId)
      ),
      tasks: tasks.data.map((item) => mapCareTask(item, profileId)),
      vitals: vitals.data.map((item) => mapVitalReading(item, profileId)),
      documents: documents.data.map((item) => mapDocument(item, profileId)),
    }
  }

  async createProfile(input: {
    displayName: string
  }) {
    const response = await this.client.request<ApiProfile>("/care-profiles", {
      method: "POST",
      body: JSON.stringify({ display_name: input.displayName }),
    })
    return mapProfile(response)
  }

  async updateProfile(id: string, patch: Partial<CareProfile>) {
    const response = await this.client.request<ApiProfile>(
      `/care-profiles/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          display_name: patch.displayName,
        }),
      }
    )
    return mapProfile(response)
  }

  async archiveProfile(id: string) {
    await this.client.request<void>(`/care-profiles/${id}`, {
      method: "DELETE",
    })
  }

  async createCircle(input: Omit<CareCircle, "id" | "profileIds" | "archived">) {
    const response = await this.client.request<ApiCircle>("/care-circles", {
      method: "POST",
      body: JSON.stringify({
        name: input.name,
        description: input.description,
      }),
    })
    return mapCircle(response)
  }

  async updateCircle(id: string, patch: Partial<CareCircle>) {
    const response = await this.client.request<ApiCircle>(
      `/care-circles/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          name: patch.name,
          description: patch.description,
        }),
      }
    )
    return mapCircle(response)
  }

  async archiveCircle(id: string) {
    await this.client.request<void>(`/care-circles/${id}`, {
      method: "DELETE",
    })
  }

  async linkProfileToCircle(profileId: string, circleId: string) {
    await this.client.request<void>(
      `/care-profiles/${profileId}/link-to-circle`,
      {
        method: "POST",
        body: JSON.stringify({ circle_id: circleId }),
      }
    )
  }

  async inviteMember(profileId: string, email: string, role: CareRole) {
    const response = await this.client.request<ApiInvite>(
      `${profilePath(profileId)}/invites`,
      {
        method: "POST",
        body: JSON.stringify({ email, role }),
      }
    )
    return mapInvite(response, profileId)
  }

  async revokeInvite(profileId: string, inviteId: string) {
    await this.client.request<void>(
      `${profilePath(profileId)}/invites/${inviteId}/revoke`,
      { method: "POST" }
    )
  }

  async acceptInvite(token: string) {
    const response = await this.client.request<AcceptMembershipResponse>(
      "/invites/accept",
      {
        method: "POST",
        body: JSON.stringify({ token }),
      }
    )
    return response.care_profile_id
  }

  async createClaim(profileId: string, email: string) {
    const response = await this.client.request<ApiClaim>(
      `${profilePath(profileId)}/claim-requests`,
      {
        method: "POST",
        body: JSON.stringify({ email }),
      }
    )
    return mapClaim(response, profileId)
  }

  async revokeClaim(profileId: string, claimId: string) {
    await this.client.request<void>(
      `${profilePath(profileId)}/claim-requests/${claimId}/revoke`,
      { method: "POST" }
    )
  }

  async acceptClaim(token: string) {
    const response = await this.client.request<AcceptMembershipResponse>(
      "/claims/accept",
      {
        method: "POST",
        body: JSON.stringify({ token }),
      }
    )
    return response.care_profile_id
  }

  async listProfileAccess(profileId: string) {
    const response = await this.client.request<ApiAccessReview>(
      `${profilePath(profileId)}/members`
    )
    return mapAccessMembers(response, profileId)
  }

  async updateMemberRole(
    profileId: string,
    userId: string,
    role: CareRole,
    _permissions?: CarePermissions
  ) {
    const response = await this.client.request<ApiAccessReview>(
      `${profilePath(profileId)}/members/${userId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ role }),
      }
    )
    return mapAccessMembers(response, profileId)
  }

  async removeMember(profileId: string, userId: string) {
    const response = await this.client.request<ApiAccessReview>(
      `${profilePath(profileId)}/members/${userId}`,
      { method: "DELETE" }
    )
    return mapAccessMembers(response, profileId)
  }

  async listCareLogs(profileId: string, params?: ListParams) {
    const response = await this.client.request<PaginatedResponse<ApiCareLog>>(
      `${profilePath(profileId)}/care-logs${toListQuery(params)}`
    )
    return mapPaginated(response, (item) => mapCareLog(item, profileId))
  }

  async createCareLog(
    profileId: string,
    input: Omit<CareLog, "id" | "profileId">
  ) {
    const response = await this.client.request<ApiCareLog>(
      `${profilePath(profileId)}/care-logs`,
      {
        method: "POST",
        body: JSON.stringify({
          log_type: input.logType,
          title: input.title,
          body: input.body,
          occurred_at: input.occurredAt,
          visibility: input.visibility,
        }),
      }
    )
    return mapCareLog(response, profileId)
  }

  async updateCareLog(
    profileId: string,
    logId: string,
    input: Partial<CareLog>
  ) {
    const response = await this.client.request<ApiCareLog>(
      `${profilePath(profileId)}/care-logs/${logId}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          title: input.title,
          body: input.body,
          occurred_at: input.occurredAt,
        }),
      }
    )
    return mapCareLog(response, profileId)
  }

  async deleteCareLog(profileId: string, logId: string) {
    await this.client.request<void>(
      `${profilePath(profileId)}/care-logs/${logId}`,
      { method: "DELETE" }
    )
  }

  async listTimeline(profileId: string, params?: ListParams) {
    const response = await this.client.request<PaginatedResponse<ApiCareLog>>(
      `${profilePath(profileId)}/timeline${toListQuery(params)}`
    )
    return mapPaginated(response, (item) => mapTimelineItem(item, profileId))
  }

  async listMedications(profileId: string, params?: ListParams) {
    const response = await this.client.request<PaginatedResponse<ApiMedication>>(
      `${profilePath(profileId)}/medications${toListQuery(params)}`
    )
    return mapPaginated(response, (item) => mapMedication(item, profileId))
  }

  async createMedication(
    profileId: string,
    input: Omit<Medication, "id" | "profileId">
  ) {
    const response = await this.client.request<ApiMedication>(
      `${profilePath(profileId)}/medications`,
      {
        method: "POST",
        body: JSON.stringify({
          name: input.name,
          dosage: input.dosage,
          instructions: input.instructions,
          before_after_meal: input.beforeAfterMeal,
        }),
      }
    )
    return mapMedication(response, profileId)
  }

  async updateMedication(
    profileId: string,
    medicationId: string,
    patch: Partial<Medication>
  ) {
    const response = await this.client.request<ApiMedication>(
      `${profilePath(profileId)}/medications/${medicationId}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          name: patch.name,
          dosage: patch.dosage,
          instructions: patch.instructions,
          before_after_meal: patch.beforeAfterMeal,
          status: patch.status,
        }),
      }
    )
    return mapMedication(response, profileId)
  }

  async deleteMedication(profileId: string, medicationId: string) {
    await this.client.request<void>(
      `${profilePath(profileId)}/medications/${medicationId}`,
      { method: "DELETE" }
    )
  }

  async createSchedule(
    profileId: string,
    medicationId: string,
    input: Omit<MedicationSchedule, "id">
  ) {
    const response = await this.client.request<ApiMedicationSchedule>(
      `${profilePath(profileId)}/medications/${medicationId}/schedules`,
      {
        method: "POST",
        body: JSON.stringify({
          schedule_type: input.scheduleType,
          time_of_day: input.timeOfDay,
          rrule: input.rrule,
          timezone: input.timezone,
        }),
      }
    )
    return mapSchedule(response)
  }

  async updateSchedule(
    profileId: string,
    medicationId: string,
    scheduleId: string,
    patch: Partial<MedicationSchedule>
  ) {
    const response = await this.client.request<ApiMedicationSchedule>(
      `${profilePath(profileId)}/medications/${medicationId}/schedules/${scheduleId}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          schedule_type: patch.scheduleType,
          time_of_day: patch.timeOfDay,
          rrule: patch.rrule,
          timezone: patch.timezone,
        }),
      }
    )
    return mapSchedule(response)
  }

  async deleteSchedule(
    profileId: string,
    medicationId: string,
    scheduleId: string
  ) {
    await this.client.request<void>(
      `${profilePath(profileId)}/medications/${medicationId}/schedules/${scheduleId}`,
      { method: "DELETE" }
    )
  }

  async actOnEvent(
    profileId: string,
    eventId: string,
    action: EventAction,
    note?: string
  ) {
    await this.client.request<void>(
      `${profilePath(profileId)}/medication-events/${eventId}/action`,
      {
        method: "POST",
        body: JSON.stringify({ action, note }),
      }
    )
  }

  async listAppointments(profileId: string, params?: ListParams) {
    const response = await this.client.request<PaginatedResponse<ApiAppointment>>(
      `${profilePath(profileId)}/appointments${toListQuery(params)}`
    )
    return mapPaginated(response, (item) => mapAppointment(item, profileId))
  }

  async createAppointment(
    profileId: string,
    input: Omit<Appointment, "id" | "profileId">
  ) {
    const response = await this.client.request<ApiAppointment>(
      `${profilePath(profileId)}/appointments`,
      {
        method: "POST",
        body: JSON.stringify({
          title: input.title,
          location: input.location,
          doctor_name: input.doctorName,
          appointment_at: input.appointmentAt,
          notes: input.notes,
        }),
      }
    )
    return mapAppointment(response, profileId)
  }

  async updateAppointment(
    profileId: string,
    appointmentId: string,
    patch: Partial<Appointment>
  ) {
    const response = await this.client.request<ApiAppointment>(
      `${profilePath(profileId)}/appointments/${appointmentId}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          title: patch.title,
          location: patch.location,
          doctor_name: patch.doctorName,
          appointment_at: patch.appointmentAt,
          notes: patch.notes,
          status: patch.status,
        }),
      }
    )
    return mapAppointment(response, profileId)
  }

  async deleteAppointment(profileId: string, appointmentId: string) {
    await this.client.request<void>(
      `${profilePath(profileId)}/appointments/${appointmentId}`,
      { method: "DELETE" }
    )
  }

  async listTasks(profileId: string, params?: ListParams) {
    const response = await this.client.request<PaginatedResponse<ApiCareTask>>(
      `${profilePath(profileId)}/care-tasks${toListQuery(params)}`
    )
    return mapPaginated(response, (item) => mapCareTask(item, profileId))
  }

  async createTask(
    profileId: string,
    input: Omit<CareTask, "id" | "profileId">
  ) {
    const response = await this.client.request<ApiCareTask>(
      `${profilePath(profileId)}/care-tasks`,
      {
        method: "POST",
        body: JSON.stringify({
          title: input.title,
          description: input.description,
          assigned_to_user_id: input.assignedToUserId,
          due_at: input.dueAt || undefined,
        }),
      }
    )
    return mapCareTask(response, profileId)
  }

  async updateTask(
    profileId: string,
    taskId: string,
    patch: Partial<CareTask>
  ) {
    const response = await this.client.request<ApiCareTask>(
      `${profilePath(profileId)}/care-tasks/${taskId}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          title: patch.title,
          description: patch.description,
          status: patch.status,
          due_at: patch.dueAt || undefined,
          assigned_to_user_id: patch.assignedToUserId,
        }),
      }
    )
    return mapCareTask(response, profileId)
  }

  async deleteTask(profileId: string, taskId: string) {
    await this.client.request<void>(
      `${profilePath(profileId)}/care-tasks/${taskId}`,
      { method: "DELETE" }
    )
  }

  async listVitals(profileId: string, params?: ListParams) {
    const response = await this.client.request<PaginatedResponse<ApiVitalReading>>(
      `${profilePath(profileId)}/vital-readings${toListQuery(params)}`
    )
    return mapPaginated(response, (item) => mapVitalReading(item, profileId))
  }

  async createVital(
    profileId: string,
    input: Omit<VitalReading, "id" | "profileId">
  ) {
    const response = await this.client.request<ApiVitalReading>(
      `${profilePath(profileId)}/vital-readings`,
      {
        method: "POST",
        body: JSON.stringify({
          reading_type: input.readingType,
          value_numeric: input.valueNumeric,
          value_text: input.valueText,
          unit: input.unit,
          systolic: input.systolic,
          diastolic: input.diastolic,
          measured_at: input.measuredAt,
          note: input.note,
        }),
      }
    )
    return mapVitalReading(response, profileId)
  }

  async updateVital(
    profileId: string,
    readingId: string,
    patch: Partial<VitalReading>
  ) {
    const response = await this.client.request<ApiVitalReading>(
      `${profilePath(profileId)}/vital-readings/${readingId}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          value_numeric: patch.valueNumeric,
          value_text: patch.valueText,
          unit: patch.unit,
          systolic: patch.systolic,
          diastolic: patch.diastolic,
          measured_at: patch.measuredAt,
          note: patch.note,
        }),
      }
    )
    return mapVitalReading(response, profileId)
  }

  async deleteVital(profileId: string, readingId: string) {
    await this.client.request<void>(
      `${profilePath(profileId)}/vital-readings/${readingId}`,
      { method: "DELETE" }
    )
  }

  async listDocuments(profileId: string, params?: ListParams) {
    const response = await this.client.request<PaginatedResponse<ApiDocument>>(
      `${profilePath(profileId)}/documents${toListQuery(params)}`
    )
    return mapPaginated(response, (item) => mapDocument(item, profileId))
  }

  async createDocument(
    profileId: string,
    input: Omit<
      CareDocument,
      "id" | "profileId" | "uploadState" | "uploadProgress"
    >
  ) {
    const response = await this.client.request<ApiDocument>(
      `${profilePath(profileId)}/documents`,
      {
        method: "POST",
        body: JSON.stringify({
          title: input.title,
          document_type: input.documentType,
          issue_date: input.issueDate,
          expiry_date: input.expiryDate,
          notes: input.notes,
        }),
      }
    )
    return mapDocument(response, profileId)
  }

  async updateDocument(
    profileId: string,
    documentId: string,
    patch: Partial<CareDocument>
  ) {
    const response = await this.client.request<ApiDocument>(
      `${profilePath(profileId)}/documents/${documentId}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          title: patch.title,
          document_type: patch.documentType,
          issue_date: patch.issueDate,
          expiry_date: patch.expiryDate,
          notes: patch.notes,
        }),
      }
    )
    return mapDocument(response, profileId)
  }

  async deleteDocument(profileId: string, documentId: string) {
    await this.client.request<void>(
      `${profilePath(profileId)}/documents/${documentId}`,
      { method: "DELETE" }
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
    const intent = await this.client.request<import("@/lib/infrastructure/api/types").UploadIntentResponse>(
      `${profilePath(profileId)}/uploads/intents`,
      {
        method: "POST",
        idempotencyKey: crypto.randomUUID(),
        body: JSON.stringify({
          title: input.title,
          document_type: input.documentType,
          mime_type: file.type,
          filename: file.name,
        }),
      }
    )

    const uploadResponse = await fetch(intent.upload_url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    })
    if (!uploadResponse.ok) {
      throw new ApiError("Muat naik fail gagal.", {
        code: "storage_error",
        status: uploadResponse.status,
      })
    }

    await this.client.request<{ status: string }>(
      `${profilePath(profileId)}/uploads/${intent.intent_id}/complete`,
      {
        method: "POST",
        idempotencyKey: crypto.randomUUID(),
      }
    )

    const listed = await this.listDocuments(profileId, { page: 1, perPage: 20 })
    const created =
      listed.data.find((item) => item.title === input.title) ?? listed.data[0]
    if (!created) {
      throw new ApiError("Dokumen sedang diproses. Muat semula senarai.", {
        code: "internal",
        status: 202,
      })
    }

    if (input.issueDate || input.expiryDate || input.notes) {
      return this.updateDocument(profileId, created.id, {
        issueDate: input.issueDate,
        expiryDate: input.expiryDate,
        notes: input.notes,
      })
    }

    return created
  }

  async getDocumentDownloadUrl(profileId: string, documentId: string) {
    const response = await this.client.request<
      import("@/lib/infrastructure/api/types").DocumentDownloadResponse
    >(`${profilePath(profileId)}/documents/${documentId}/download-url`)
    return {
      url: response.url,
      filename: response.filename,
    }
  }
}

export type { CareSnapshot, PaginatedResult }
