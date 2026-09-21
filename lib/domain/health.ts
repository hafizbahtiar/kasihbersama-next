/**
 * Rekod kesihatan seorang person (docs/04): kad kecemasan, keadaan, alahan,
 * janji temu, lawatan. Ubat, vital dan imunisasi menyusul.
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

export type AppointmentStatus =
  | "scheduled"
  | "attended"
  | "missed"
  | "cancelled"
  | "rescheduled"

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "scheduled",
  "attended",
  "missed",
  "cancelled",
  "rescheduled",
]

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "Dijadualkan",
  attended: "Hadir",
  missed: "Tidak hadir",
  cancelled: "Dibatalkan",
  rescheduled: "Ditukar tarikh",
}

/**
 * Janji temu. Fasiliti dan pengamal ialah direktori yang belum wujud, jadi
 * `locationNote` menjawab "di mana" buat masa ini.
 *
 * Pada akses `summary` pelayan menggugurkan nota; tujuan, masa dan tempat kekal,
 * kerana orang yang ada akses ringkasan selalunya orang yang memandu ke sana.
 */
export type HealthAppointment = {
  id: string
  purpose: string
  startsAt: string
  endsAt?: string
  locationNote?: string
  status: AppointmentStatus
  notes?: string
  createdAt: string
}

/**
 * Lawatan yang SUDAH berlaku - pelayan menolak tarikh masa depan.
 *
 * `costAmount` ialah rentetan perpuluhan dari hujung ke hujung: JSON number
 * ialah float64 pada kebanyakan klien, dan itu cara sen hilang.
 *
 * Pada akses `summary` pelayan menggugurkan diagnosis, nota DAN kos.
 */
export type HealthVisit = {
  id: string
  visitedOn: string
  reason?: string
  diagnosis?: string
  notes?: string
  costAmount?: string
  costCurrency?: string
  followUpOn?: string
  createdAt: string
}
