/**
 * Care profile fields shown in the UI that are not returned or persisted by
 * `GET/PATCH /api/v1/care-profiles`.
 *
 * In API mode these values live in local UI state / mock seed only.
 *
 * Shrunk on 2026-09-09: `profileResp` grew the nine health columns that were
 * already in `care_profiles` (legal_name, date_of_birth, gender, blood_type,
 * allergy_summary, condition_summary, primary_clinic, primary_doctor,
 * emergency_note), and the medication DTO grew start_date, end_date and
 * prescribed_by. What remains here are the two names that have no column
 * anywhere - they are a frontend concept, not a backend gap, and closing them
 * needs a migration first.
 */
export const CARE_PROFILE_API_FIELD_GAPS = ["relation", "notes"] as const

export type CareProfileApiFieldGap =
  (typeof CARE_PROFILE_API_FIELD_GAPS)[number]

export function isCareProfileFieldPersisted(field: CareProfileApiFieldGap) {
  void field
  return false
}
