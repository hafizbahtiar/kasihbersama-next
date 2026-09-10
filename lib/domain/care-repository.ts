import type {
  Appointment,
  AuditEvent,
  AppointmentStatus,
  CareClaim,
  CareCircle,
  CircleMember,
  CircleMemberRole,
  CareDocument,
  CareInvite,
  CareLog,
  CareMember,
  CarePermissions,
  CareProfile,
  CareRole,
  CareSummary,
  EmergencyCard,
  CareTask,
  EventAction,
  Medication,
  MedicationSchedule,
  ProfileHealthInfo,
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
  /**
   * Restores an archived profile. Its own call rather than a status patch:
   * the PATCH body carries no status field, and the update query refuses
   * archived rows outright, so there is no way back through it.
   */
  unarchiveProfile(id: string): Promise<void>

  /**
   * The signed-in user's own health record, or null when they have not set
   * one up. Null is a real answer here, not a failure - the UI turns it into
   * the setup prompt.
   */
  getOwnHealthProfile(): Promise<CareProfile | null>
  /** Get-or-create. Safe to retry: it never produces a second record. */
  ensureOwnHealthProfile(
    input: { displayName?: string } & ProfileHealthInfo
  ): Promise<CareProfile>
}

export interface CareCircleRepository {
  createCircle(
    input: Omit<CareCircle, "id" | "profileIds" | "archived">
  ): Promise<CareCircle>
  updateCircle(id: string, patch: Partial<CareCircle>): Promise<CareCircle>
  archiveCircle(id: string): Promise<void>
  /** Restores an archived circle; PATCH is scoped to active rows. */
  unarchiveCircle(id: string): Promise<void>
  linkProfileToCircle(profileId: string, circleId: string): Promise<void>
  /**
   * Circle membership. All three return the circle's full member list, which
   * is what the backend answers with - so a caller replaces its state rather
   * than reconciling a delta it might get wrong.
   */
  listCircleMembers(circleId: string): Promise<CircleMember[]>
  addCircleMember(
    circleId: string,
    email: string,
    role: CircleMemberRole
  ): Promise<CircleMember[]>
  removeCircleMember(circleId: string, userId: string): Promise<CircleMember[]>
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
/**
 * The profile's administrative history and its doctor-visit summaries.
 *
 * Grouped together because both are admin-side reads over a care profile
 * rather than care content, and both are gated on a permission most members do
 * not have - the audit trail on `can_change_roles`, summaries on
 * `can_export_summary`.
 */
export interface CareAdminRepository {
  listAuditEvents(
    profileId: string,
    params?: ListParams
  ): Promise<PaginatedResult<AuditEvent>>

  /** Rejects with 403 when the caller lacks can_view_emergency_card. */
  getEmergencyCard(profileId: string): Promise<EmergencyCard>

  createSummary(
    profileId: string,
    period: { periodStart: string; periodEnd: string }
  ): Promise<CareSummary>
  listSummaries(
    profileId: string,
    params?: ListParams
  ): Promise<PaginatedResult<CareSummary>>
  getSummary(profileId: string, summaryId: string): Promise<CareSummary>
}

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
    CareDocumentRepository,
    CareAdminRepository {}

export type { AppointmentStatus, TaskStatus }
