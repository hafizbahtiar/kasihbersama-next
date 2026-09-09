import type {
  Appointment,
  AppointmentStatus,
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
  TaskStatus,
  TimelineItem,
  VitalReading,
} from "@/lib/domain/care"
import type { CareSnapshot } from "@/lib/domain/care-snapshot"
import type { ListParams, PaginatedResult } from "@/lib/domain/pagination"

/**
 * Split by aggregate so a consumer can name the slice it actually uses.
 * CareRepository below composes them, which is what the two implementations
 * and the composition root still bind to - the seam is here, at the point of
 * consumption, not at the point of implementation.
 */
export interface CareSnapshotReader {
  getSnapshot(profileId?: string): Promise<CareSnapshot>
}

export interface CareProfileRepository {
  createProfile(input: {
    displayName: string
    relation?: string
    dateOfBirth?: string
    notes?: string
    status?: ProfileStatus
  }): Promise<CareProfile>
  updateProfile(id: string, patch: Partial<CareProfile>): Promise<CareProfile>
  archiveProfile(id: string): Promise<void>
}

export interface CareCircleRepository {
  createCircle(
    input: Omit<CareCircle, "id" | "profileIds" | "archived">
  ): Promise<CareCircle>
  updateCircle(id: string, patch: Partial<CareCircle>): Promise<CareCircle>
  archiveCircle(id: string): Promise<void>
  linkProfileToCircle(profileId: string, circleId: string): Promise<void>
}

export interface CareMembershipRepository {
  inviteMember(
    profileId: string,
    email: string,
    role: CareRole
  ): Promise<CareInvite>
  revokeInvite(profileId: string, inviteId: string): Promise<void>
  acceptInvite(token: string): Promise<string>
  createClaim(profileId: string, email: string): Promise<CareClaim>
  revokeClaim(profileId: string, claimId: string): Promise<void>
  acceptClaim(token: string): Promise<string>
  listProfileAccess(profileId: string): Promise<CareMember[]>
  updateMemberRole(
    profileId: string,
    userId: string,
    role: CareRole,
    permissions?: CarePermissions
  ): Promise<CareMember[]>
  removeMember(profileId: string, userId: string): Promise<CareMember[]>
}

export interface CareLogRepository {
  listCareLogs(
    profileId: string,
    params?: ListParams
  ): Promise<PaginatedResult<CareLog>>
  createCareLog(
    profileId: string,
    input: Omit<CareLog, "id" | "profileId">
  ): Promise<CareLog>
  updateCareLog(
    profileId: string,
    logId: string,
    input: Partial<CareLog>
  ): Promise<CareLog>
  deleteCareLog(profileId: string, logId: string): Promise<void>

  listTimeline(
    profileId: string,
    params?: ListParams
  ): Promise<PaginatedResult<TimelineItem>>
}

export interface MedicationRepository {
  createMedication(
    profileId: string,
    input: Omit<Medication, "id" | "profileId">
  ): Promise<Medication>
  listMedications(
    profileId: string,
    params?: ListParams
  ): Promise<PaginatedResult<Medication>>
  updateMedication(
    profileId: string,
    medicationId: string,
    patch: Partial<Medication>
  ): Promise<Medication>
  deleteMedication(profileId: string, medicationId: string): Promise<void>
  createSchedule(
    profileId: string,
    medicationId: string,
    input: Omit<MedicationSchedule, "id">
  ): Promise<MedicationSchedule>
  updateSchedule(
    profileId: string,
    medicationId: string,
    scheduleId: string,
    patch: Partial<MedicationSchedule>
  ): Promise<MedicationSchedule>
  deleteSchedule(
    profileId: string,
    medicationId: string,
    scheduleId: string
  ): Promise<void>
  actOnEvent(
    profileId: string,
    eventId: string,
    action: EventAction,
    note?: string
  ): Promise<void>
}

export interface AppointmentRepository {
  listAppointments(
    profileId: string,
    params?: ListParams
  ): Promise<PaginatedResult<Appointment>>
  createAppointment(
    profileId: string,
    input: Omit<Appointment, "id" | "profileId">
  ): Promise<Appointment>
  updateAppointment(
    profileId: string,
    appointmentId: string,
    patch: Partial<Appointment>
  ): Promise<Appointment>
  deleteAppointment(profileId: string, appointmentId: string): Promise<void>
}

export interface CareTaskRepository {
  listTasks(
    profileId: string,
    params?: ListParams
  ): Promise<PaginatedResult<CareTask>>
  createTask(
    profileId: string,
    input: Omit<CareTask, "id" | "profileId">
  ): Promise<CareTask>
  updateTask(
    profileId: string,
    taskId: string,
    patch: Partial<CareTask>
  ): Promise<CareTask>
  deleteTask(profileId: string, taskId: string): Promise<void>
}

export interface VitalRepository {
  listVitals(
    profileId: string,
    params?: ListParams
  ): Promise<PaginatedResult<VitalReading>>
  createVital(
    profileId: string,
    input: Omit<VitalReading, "id" | "profileId">
  ): Promise<VitalReading>
  updateVital(
    profileId: string,
    readingId: string,
    patch: Partial<VitalReading>
  ): Promise<VitalReading>
  deleteVital(profileId: string, readingId: string): Promise<void>
}

export interface CareDocumentRepository {
  listDocuments(
    profileId: string,
    params?: ListParams
  ): Promise<PaginatedResult<CareDocument>>
  createDocument(
    profileId: string,
    input: Omit<
      CareDocument,
      "id" | "profileId" | "uploadState" | "uploadProgress"
    >
  ): Promise<CareDocument>
  updateDocument(
    profileId: string,
    documentId: string,
    patch: Partial<CareDocument>
  ): Promise<CareDocument>
  deleteDocument(profileId: string, documentId: string): Promise<void>
  uploadDocument(
    profileId: string,
    file: File,
    input: {
      title: string
      documentType: CareDocument["documentType"]
      issueDate?: string
      expiryDate?: string
      notes?: string
    }
  ): Promise<CareDocument>
  getDocumentDownloadUrl(
    profileId: string,
    documentId: string
  ): Promise<{ url: string; filename: string }>
}

/**
 * Everything a full care client needs. The API and in-memory implementations
 * both satisfy this, so the composition root stays a single binding.
 */
export interface CareRepository
  extends
    CareSnapshotReader,
    CareProfileRepository,
    CareCircleRepository,
    CareMembershipRepository,
    CareLogRepository,
    MedicationRepository,
    AppointmentRepository,
    CareTaskRepository,
    VitalRepository,
    CareDocumentRepository {}

export type { AppointmentStatus, TaskStatus }
