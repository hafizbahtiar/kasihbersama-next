import {
  CARE_PERMISSIONS,
  CARE_ROLES,
  type Appointment,
  type CareClaim,
  type CareCircle,
  type CareDocument,
  type CareInvite,
  type CareLog,
  type CareMember,
  type CarePermissions,
  type CareProfile,
  type CareTask,
  type Medication,
  type MedicationEvent,
  type MedicationSchedule,
  type VitalReading,
  LOG_TYPE_OPTIONS,
  viewerPermissions,
  type TimelineItem,
} from "@/lib/domain/care"
import type { PaginatedResponse } from "@/lib/infrastructure/api/types"
import type { PaginatedResult } from "@/lib/domain/pagination"
import { asEnum } from "@/lib/application/form-validation"

type ApiProfile = {
  id: string
  display_name: string
  role?: string
  permissions?: Record<string, boolean>
  status: string
  /** ISO "YYYY-MM-DD". Omitted when unknown, never blank. */
  date_of_birth?: string
}

type ApiCircle = {
  id: string
  name: string
  description?: string
  profiles: Array<{
    care_profile_id: string
    display_name: string
    role: string
  }>
}

type ApiCareLog = {
  id: string
  log_type: string
  title?: string
  body?: string
  occurred_at: string
  visibility: string
  author_display_name?: string
}

type ApiMedication = {
  id: string
  name: string
  dosage?: string
  instructions?: string
  before_after_meal?: string
  status: string
  /** ISO "YYYY-MM-DD" - the same shape the write endpoints accept. */
  start_date?: string
  end_date?: string
  prescribed_by?: string
}

type ApiMedicationSchedule = {
  id: string
  medication_id: string
  schedule_type: string
  time_of_day?: string
  rrule?: string
  timezone: string
  status: string
}

type ApiMedicationEvent = {
  id: string
  medication_id: string
  schedule_id?: string
  action_status: string
  expected_at: string
}

type ApiAppointment = {
  id: string
  title: string
  location?: string
  doctor_name?: string
  appointment_at: string
  notes?: string
  status: string
}

type ApiCareTask = {
  id: string
  title: string
  description?: string
  assigned_to_user_id?: string
  due_at?: string
  status: string
}

type ApiVitalReading = {
  id: string
  reading_type: string
  value_numeric?: number
  value_text?: string
  unit?: string
  systolic?: number
  diastolic?: number
  measured_at: string
  note?: string
}

type ApiDocument = {
  id: string
  title: string
  document_type: string
  issue_date?: string
  expiry_date?: string
  notes?: string
  created_at: string
  latest_filename?: string
  latest_mime?: string
  latest_size_bytes?: number
}

type ApiInvite = {
  id: string
  role: string
  status: string
  email?: string
  expires_at: string
  created_at: string
}

type ApiClaim = {
  id: string
  status: string
  email?: string
  expires_at: string
  created_at: string
}

type ApiMember = {
  user_id: string
  display_name: string
  email?: string
  role: string
  status: string
}

export function mapPermissions(
  permissions?: Record<string, boolean>
): CarePermissions {
  const base = viewerPermissions()
  if (!permissions) {
    return base
  }
  for (const permission of CARE_PERMISSIONS) {
    if (permission in permissions) {
      base[permission] = Boolean(permissions[permission])
    }
  }
  return base
}

export function mapProfile(api: ApiProfile): CareProfile {
  // relation and notes are still absent from profileResp — see
  // lib/application/care-profile-field-gaps.ts. date_of_birth landed
  // 2026-09-09 and is read here.
  return {
    id: api.id,
    displayName: api.display_name,
    relation: "",
    dateOfBirth: api.date_of_birth ?? "",
    status: asEnum(api.status, ["active", "archived"] as const, "active"),
    role: asEnum(
      api.role ?? "family_viewer",
      [
        "subject_owner",
        "guardian_admin",
        "family_contributor",
        "caregiver_limited",
        "family_viewer",
        "emergency_viewer",
      ] as const,
      "family_viewer"
    ),
    permissions: mapPermissions(api.permissions),
  }
}

export function mapCircle(api: ApiCircle): CareCircle {
  return {
    id: api.id,
    name: api.name,
    description: api.description ?? "",
    profileIds: api.profiles.map((item) => item.care_profile_id),
  }
}

export function mapCareLog(api: ApiCareLog, profileId: string): CareLog {
  return {
    id: api.id,
    profileId,
    logType: api.log_type,
    title: api.title ?? "",
    body: api.body ?? "",
    visibility: asEnum(
      api.visibility,
      ["circle", "caregivers", "private"] as const,
      "circle"
    ),
    occurredAt: api.occurred_at,
    createdBy: api.author_display_name ?? "Penjaga",
  }
}

export function mapTimelineItem(
  api: ApiCareLog,
  profileId: string
): TimelineItem {
  return {
    id: `log:${api.id}`,
    profileId,
    occurredAt: api.occurred_at,
    kind: "log",
    title: api.title ?? "",
    body: api.body ?? "",
    meta:
      LOG_TYPE_OPTIONS.find((item) => item.value === api.log_type)?.label ??
      api.log_type,
  }
}

export function mapMedication(
  api: ApiMedication,
  profileId: string
): Medication {
  return {
    id: api.id,
    profileId,
    name: api.name,
    dosage: api.dosage ?? "",
    instructions: api.instructions ?? "",
    beforeAfterMeal: api.before_after_meal ?? "",
    prescribedBy: api.prescribed_by ?? "",
    startDate: api.start_date ?? "",
    endDate: api.end_date,
    status: asEnum(
      api.status,
      ["active", "paused", "ended"] as const,
      "active"
    ),
  }
}

export function mapSchedule(api: ApiMedicationSchedule): MedicationSchedule {
  return {
    id: api.id,
    medicationId: api.medication_id,
    scheduleType: asEnum(
      api.schedule_type,
      ["daily", "weekly", "multi_daily", "as_needed"] as const,
      "daily"
    ),
    timeOfDay: api.time_of_day,
    timezone: api.timezone,
    rrule: api.rrule,
    status: asEnum(api.status, ["active", "paused"] as const, "active"),
  }
}

export function mapMedicationEvent(
  api: ApiMedicationEvent,
  profileId: string
): MedicationEvent {
  return {
    id: api.id,
    profileId,
    medicationId: api.medication_id,
    scheduleId: api.schedule_id,
    expectedAt: api.expected_at,
    actionStatus: asEnum(
      api.action_status,
      ["pending", "taken", "skipped", "postponed", "missed"] as const,
      "pending"
    ),
  }
}

export function mapAppointment(
  api: ApiAppointment,
  profileId: string
): Appointment {
  return {
    id: api.id,
    profileId,
    title: api.title,
    location: api.location ?? "",
    doctorName: api.doctor_name ?? "",
    appointmentAt: api.appointment_at,
    notes: api.notes ?? "",
    status: asEnum(
      api.status,
      ["scheduled", "completed", "cancelled", "missed"] as const,
      "scheduled"
    ),
  }
}

export function mapCareTask(api: ApiCareTask, profileId: string): CareTask {
  return {
    id: api.id,
    profileId,
    title: api.title,
    description: api.description ?? "",
    assignedToUserId: api.assigned_to_user_id,
    dueAt: api.due_at ?? "",
    status: asEnum(
      api.status,
      ["open", "in_progress", "completed", "cancelled"] as const,
      "open"
    ),
  }
}

export function mapVitalReading(
  api: ApiVitalReading,
  profileId: string
): VitalReading {
  return {
    id: api.id,
    profileId,
    readingType: api.reading_type,
    valueNumeric: api.value_numeric,
    valueText: api.value_text,
    unit: api.unit,
    systolic: api.systolic,
    diastolic: api.diastolic,
    measuredAt: api.measured_at,
    note: api.note,
  }
}

export function mapDocument(api: ApiDocument, profileId: string): CareDocument {
  return {
    id: api.id,
    profileId,
    title: api.title,
    documentType: asEnum(
      api.document_type,
      ["prescription", "lab_result", "imaging", "insurance", "other"] as const,
      "other"
    ),
    filename: api.latest_filename ?? "",
    mimeType: api.latest_mime ?? "",
    sizeBytes: api.latest_size_bytes ?? 0,
    issueDate: api.issue_date,
    expiryDate: api.expiry_date,
    notes: api.notes,
    createdAt: api.created_at,
    uploadState: "done",
    uploadProgress: 100,
  }
}

export function mapInvite(api: ApiInvite, profileId: string): CareInvite {
  return {
    id: api.id,
    profileId,
    email: api.email ?? "",
    role: asEnum(api.role, CARE_ROLES, "family_viewer"),
    status: asEnum(
      api.status,
      ["pending", "accepted", "revoked", "expired"] as const,
      "pending"
    ),
    token: "",
    expiresAt: api.expires_at,
    createdAt: api.created_at,
  }
}

export function mapClaim(api: ApiClaim, profileId: string): CareClaim {
  return {
    id: api.id,
    profileId,
    email: api.email ?? "",
    status: asEnum(
      api.status,
      ["pending", "accepted", "revoked", "expired"] as const,
      "pending"
    ),
    token: "",
    expiresAt: api.expires_at,
    createdAt: api.created_at,
  }
}

export function mapMember(api: ApiMember, profileId: string): CareMember {
  return {
    id: `${profileId}:${api.user_id}`,
    profileId,
    userId: api.user_id,
    displayName: api.display_name,
    email: api.email ?? "",
    role: asEnum(api.role, CARE_ROLES, "family_viewer"),
    status: asEnum(
      api.status,
      ["active", "invited", "expired"] as const,
      "active"
    ),
    permissions: viewerPermissions(),
  }
}

export function mapPaginated<TApi, TDomain>(
  response: PaginatedResponse<TApi>,
  mapper: (item: TApi) => TDomain
): PaginatedResult<TDomain> {
  return {
    data: response.data.map(mapper),
    total: response.total,
    page: response.page,
    perPage: response.per_page,
    totalPages: response.total_pages,
    hasMore: response.has_more,
  }
}

export function toListQuery(params?: {
  page?: number
  perPage?: number
  filter?: Record<string, string>
}) {
  const search = new URLSearchParams()
  search.set("page", String(params?.page ?? 1))
  search.set("per_page", String(params?.perPage ?? 20))
  if (params?.filter) {
    for (const [key, value] of Object.entries(params.filter)) {
      if (value) {
        search.set(key, value)
      }
    }
  }
  const query = search.toString()
  return query ? `?${query}` : ""
}

export type {
  ApiAppointment,
  ApiCareLog,
  ApiCareTask,
  ApiCircle,
  ApiClaim,
  ApiDocument,
  ApiInvite,
  ApiMedication,
  ApiMedicationEvent,
  ApiMedicationSchedule,
  ApiMember,
  ApiProfile,
  ApiVitalReading,
}
