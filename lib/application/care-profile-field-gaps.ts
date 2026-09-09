/**
 * Care profile fields shown in the UI that are not yet returned or persisted by
 * `GET/PATCH /api/v1/care-profiles` (backend `profileResp` exposes only
 * id, display_name, subject_user_id, role, permissions, status).
 *
 * In API mode these values are kept in local UI state / mock seed only until
 * the backend DTO grows. See docs/api-contract-frontend.md.
 */
export const CARE_PROFILE_API_FIELD_GAPS = [
  "relation",
  "dateOfBirth",
  "notes",
] as const

export type CareProfileApiFieldGap =
  (typeof CARE_PROFILE_API_FIELD_GAPS)[number]

export const MEDICATION_API_FIELD_GAPS = [
  "prescribedBy",
  "startDate",
  "endDate",
] as const

export type MedicationApiFieldGap = (typeof MEDICATION_API_FIELD_GAPS)[number]

export function isCareProfileFieldPersisted(field: CareProfileApiFieldGap) {
  void field
  return false
}

export function isMedicationFieldPersisted(field: MedicationApiFieldGap) {
  void field
  return false
}
