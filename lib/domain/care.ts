export const CARE_ROLES = [
  "subject_owner",
  "guardian_admin",
  "family_contributor",
  "caregiver_limited",
  "family_viewer",
  "emergency_viewer",
] as const

export type CareRole = (typeof CARE_ROLES)[number]

export const CARE_PERMISSIONS = [
  "can_view_timeline",
  "can_add_daily_log",
  "can_edit_medication_setup",
  "can_tick_medication",
  "can_view_vitals",
  "can_add_vitals",
  "can_view_documents",
  "can_upload_documents",
  "can_export_summary",
  "can_invite_members",
  "can_change_roles",
  "can_archive_profile",
  "can_update_profile",
  "can_view_emergency_card",
  "can_manage_appointments",
  "can_manage_care_tasks",
] as const

export type CarePermission = (typeof CARE_PERMISSIONS)[number]
export type CarePermissions = Record<CarePermission, boolean>

export type ProfileStatus = "active" | "archived"
export type MemberStatus = "active" | "invited" | "expired"
export type InviteStatus = "pending" | "accepted" | "revoked" | "expired"
export type ClaimStatus = "pending" | "accepted" | "revoked" | "expired"
export type MedicationStatus = "active" | "paused" | "ended"
export type ScheduleType = "daily" | "weekly" | "multi_daily" | "as_needed"
export type EventStatus =
  "pending" | "taken" | "skipped" | "postponed" | "missed"
export type EventAction = "taken" | "skipped" | "postponed"
export type AppointmentStatus =
  "scheduled" | "completed" | "cancelled" | "missed"
export type TaskStatus = "open" | "in_progress" | "completed" | "cancelled"
export type LogVisibility = "circle" | "caregivers" | "private"
export type DocumentType =
  "prescription" | "lab_result" | "imaging" | "insurance" | "other"
export type DocumentUploadState =
  "idle" | "uploading" | "processing" | "done" | "error"

/**
 * The health columns on a care profile.
 *
 * Every field is optional and absent means unknown, never blank - a form that
 * sends "" for a field nobody filled in would erase what is stored, because
 * the backend COALESCE-patches each column.
 */
export type ProfileHealthInfo = {
  legalName?: string
  dateOfBirth?: string
  gender?: string
  bloodType?: string
  allergySummary?: string
  conditionSummary?: string
  primaryClinic?: string
  primaryDoctor?: string
  emergencyNote?: string
}

export type CareProfile = {
  id: string
  displayName: string
  relation: string
  dateOfBirth: string
  status: ProfileStatus
  circleId?: string
  role: CareRole
  permissions: CarePermissions
  notes?: string
  /**
   * The user this profile is *about*, when there is one. The backend models
   * "my health" as a care profile whose subject is me, so comparing this to
   * the signed-in user is how the UI tells your own record apart from the
   * people you look after.
   */
  subjectUserId?: string
} & ProfileHealthInfo

export type CareCircle = {
  id: string
  name: string
  description: string
  profileIds: string[]
  archived?: boolean
}

export type CareMember = {
  id: string
  profileId: string
  userId: string
  displayName: string
  email: string
  role: CareRole
  status: MemberStatus
  permissions: CarePermissions
}

export type CareInvite = {
  id: string
  profileId: string
  email: string
  role: CareRole
  status: InviteStatus
  token: string
  expiresAt: string
  createdAt: string
}

export type CareClaim = {
  id: string
  profileId: string
  email: string
  status: ClaimStatus
  token: string
  expiresAt: string
  createdAt: string
}

export type CareLog = {
  id: string
  profileId: string
  logType: string
  title: string
  body: string
  visibility: LogVisibility
  occurredAt: string
  createdBy: string
}

export type TimelineItem = {
  id: string
  profileId: string
  occurredAt: string
  kind: "log" | "medication" | "appointment" | "vital" | "task" | "document"
  title: string
  body: string
  meta?: string
}

export type Medication = {
  id: string
  profileId: string
  name: string
  dosage: string
  instructions: string
  beforeAfterMeal: string
  prescribedBy: string
  startDate: string
  endDate?: string
  status: MedicationStatus
}

export type MedicationSchedule = {
  id: string
  medicationId: string
  scheduleType: ScheduleType
  timeOfDay?: string
  timezone: string
  rrule?: string
  status: "active" | "paused"
}

export type MedicationEvent = {
  id: string
  profileId: string
  medicationId: string
  scheduleId?: string
  expectedAt: string
  actionStatus: EventStatus
  note?: string
}

export type Appointment = {
  id: string
  profileId: string
  title: string
  location: string
  doctorName: string
  appointmentAt: string
  notes: string
  status: AppointmentStatus
}

export type CareTask = {
  id: string
  profileId: string
  title: string
  description: string
  assignedToUserId?: string
  assignedToName?: string
  dueAt: string
  status: TaskStatus
}

export type VitalReading = {
  id: string
  profileId: string
  readingType: string
  valueNumeric?: number
  valueText?: string
  unit?: string
  systolic?: number
  diastolic?: number
  measuredAt: string
  note?: string
}

export type CareDocument = {
  id: string
  profileId: string
  title: string
  documentType: DocumentType
  filename: string
  mimeType: string
  sizeBytes: number
  issueDate?: string
  expiryDate?: string
  notes?: string
  createdAt: string
  uploadState: DocumentUploadState
  uploadProgress: number
}

export const ROLE_LABELS: Record<CareRole, string> = {
  subject_owner: "Pemilik subjek",
  guardian_admin: "Penjaga utama",
  family_contributor: "Ahli keluarga",
  caregiver_limited: "Penjaga terhad",
  family_viewer: "Pemerhati keluarga",
  emergency_viewer: "Akses kecemasan",
}

export const PERMISSION_LABELS: Record<CarePermission, string> = {
  can_view_timeline: "Lihat timeline",
  can_add_daily_log: "Tambah log harian",
  can_edit_medication_setup: "Sunting tetapan ubat",
  can_tick_medication: "Tandakan dos ubat",
  can_view_vitals: "Lihat bacaan vital",
  can_add_vitals: "Tambah bacaan vital",
  can_view_documents: "Lihat dokumen",
  can_upload_documents: "Muat naik dokumen",
  can_export_summary: "Eksport ringkasan",
  can_invite_members: "Jemput ahli",
  can_change_roles: "Tukar peranan",
  can_archive_profile: "Arkib profil",
  can_update_profile: "Sunting profil",
  can_view_emergency_card: "Lihat kad kecemasan",
  can_manage_appointments: "Urus temujanji",
  can_manage_care_tasks: "Urus tugasan",
}

export const PROFILE_STATUS_LABELS: Record<ProfileStatus, string> = {
  active: "Aktif",
  archived: "Diarkib",
}

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  active: "Aktif",
  invited: "Dijemput",
  expired: "Tamat tempoh",
}

export const RELATION_OPTIONS = [
  { value: "Ibu", label: "Ibu" },
  { value: "Bapa", label: "Bapa" },
  { value: "Pasangan", label: "Pasangan" },
  { value: "Anak", label: "Anak" },
  { value: "Saudara", label: "Saudara" },
  { value: "Rakan", label: "Rakan" },
  { value: "Penjaga", label: "Penjaga" },
  { value: "Lain-lain", label: "Lain-lain" },
] as const

export const BEFORE_AFTER_MEAL_OPTIONS = [
  { value: "Sebelum makan", label: "Sebelum makan" },
  { value: "Selepas makan", label: "Selepas makan" },
  { value: "Tidak kira", label: "Tidak kira" },
  { value: "Semasa makan", label: "Semasa makan" },
] as const

export const TIMEZONE_OPTIONS = [
  { value: "Asia/Kuala_Lumpur", label: "Asia/Kuala_Lumpur (MYT)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT)" },
  { value: "Asia/Jakarta", label: "Asia/Jakarta (WIB)" },
  { value: "UTC", label: "UTC" },
] as const

export const MEDICATION_STATUS_LABELS: Record<MedicationStatus, string> = {
  active: "Aktif",
  paused: "Dijeda",
  ended: "Tamat",
}

export const SCHEDULE_TYPE_LABELS: Record<ScheduleType, string> = {
  daily: "Harian",
  weekly: "Mingguan",
  multi_daily: "Beberapa kali sehari",
  as_needed: "Bila perlu",
}

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  pending: "Menunggu",
  taken: "Diambil",
  skipped: "Dilangkau",
  postponed: "Ditunda",
  missed: "Terlepas",
}

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "Dijadualkan",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  missed: "Terlepas",
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  open: "Belum",
  in_progress: "Sedang",
  completed: "Selesai",
  cancelled: "Dibatalkan",
}

export const INVITE_STATUS_LABELS: Record<InviteStatus, string> = {
  pending: "Tertunda",
  accepted: "Diterima",
  revoked: "Dibatalkan",
  expired: "Tamat tempoh",
}

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  pending: "Tertunda",
  accepted: "Diterima",
  revoked: "Dibatalkan",
  expired: "Tamat tempoh",
}

export const TIMELINE_KIND_LABELS: Record<TimelineItem["kind"], string> = {
  log: "Log",
  medication: "Ubat",
  appointment: "Temujanji",
  vital: "Vital",
  task: "Tugasan",
  document: "Dokumen",
}

export const UPLOAD_STATE_LABELS: Record<DocumentUploadState, string> = {
  idle: "Belum",
  uploading: "Memuat naik",
  processing: "Diproses",
  done: "Selesai",
  error: "Ralat",
}

export const LOG_TYPE_OPTIONS = [
  { value: "note", label: "Catatan" },
  { value: "meal", label: "Makanan" },
  { value: "sleep", label: "Tidur" },
  { value: "mood", label: "Mood" },
  { value: "hygiene", label: "Kebersihan" },
  { value: "incident", label: "Insiden" },
] as const

export const VISIBILITY_LABELS: Record<LogVisibility, string> = {
  circle: "Kumpulan",
  caregivers: "Penjaga",
  private: "Peribadi",
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  prescription: "Preskripsi",
  lab_result: "Keputusan makmal",
  imaging: "Imej perubatan",
  insurance: "Insurans",
  other: "Lain-lain",
}

export const VITAL_TYPE_OPTIONS = [
  { value: "blood_pressure", label: "Tekanan darah" },
  { value: "blood_glucose", label: "Gula darah" },
  { value: "pulse", label: "Nadi" },
  { value: "weight", label: "Berat" },
  { value: "temperature", label: "Suhu" },
  { value: "spo2", label: "SpO2" },
] as const

export function emptyPermissions(): CarePermissions {
  return Object.fromEntries(
    CARE_PERMISSIONS.map((permission) => [permission, false])
  ) as CarePermissions
}

export function adminPermissions(): CarePermissions {
  return Object.fromEntries(
    CARE_PERMISSIONS.map((permission) => [permission, true])
  ) as CarePermissions
}

export function viewerPermissions(): CarePermissions {
  return {
    ...emptyPermissions(),
    can_view_timeline: true,
    can_view_vitals: true,
    can_view_documents: true,
    can_view_emergency_card: true,
  }
}

/**
 * True when this profile is the signed-in user's own health record rather than
 * someone they look after. The two are the same shape; only the subject
 * differs.
 */
export function isOwnHealthProfile(
  profile: Pick<CareProfile, "subjectUserId">,
  userId: string | undefined
) {
  return Boolean(userId && profile.subjectUserId === userId)
}
