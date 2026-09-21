/**
 * Rekod kesihatan seorang person (docs/04). Hirisan pertama: kad kecemasan,
 * keadaan, alahan. Janji temu, ubat, vital dan imunisasi menyusul.
 */
export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-"

export const BLOOD_TYPES: BloodType[] = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
]

/**
 * Kad kecemasan. Berat dan tinggi TIADA di sini - kedua-duanya berubah, jadi ia
 * bacaan vital (docs/04 §4).
 *
 * Pada akses `summary` pelayan menggugurkan insurans dan nota; jenis darah dan
 * kenalan kecemasan kekal, kerana itulah gunanya kad ini.
 */
export type HealthProfile = {
  bloodType?: BloodType
  isOrganDonor?: boolean
  emergencyContactName?: string
  emergencyContactPhone?: string
  insuranceProvider?: string
  insurancePolicyNo?: string
  notes?: string
  updatedAt?: string
}

export type ConditionStatus = "active" | "managed" | "resolved"

export const CONDITION_STATUS_LABELS: Record<ConditionStatus, string> = {
  active: "Aktif",
  managed: "Terkawal",
  resolved: "Sembuh",
}

export type HealthCondition = {
  id: string
  name: string
  status: ConditionStatus
  diagnosedOn?: string
  /** Ditetapkan oleh status, bukan oleh borang: sembuh sentiasa membawa tarikhnya. */
  resolvedOn?: string
  notes?: string
  createdAt: string
}

export type AllergySeverity = "mild" | "moderate" | "severe" | "anaphylaxis"

export const ALLERGY_SEVERITIES: AllergySeverity[] = [
  "mild",
  "moderate",
  "severe",
  "anaphylaxis",
]

export const SEVERITY_LABELS: Record<AllergySeverity, string> = {
  mild: "Ringan",
  moderate: "Sederhana",
  severe: "Teruk",
  anaphylaxis: "Anafilaksis",
}

export type HealthAllergy = {
  id: string
  allergen: string
  reaction?: string
  severity: AllergySeverity
  notedOn?: string
}
