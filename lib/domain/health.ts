/**
 * Rekod kesihatan seorang person (docs/04): kad kecemasan, keadaan, alahan,
 * janji temu, lawatan, ubat, vital, imunisasi.
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

export type MedicationForm =
  | "tablet"
  | "capsule"
  | "syrup"
  | "injection"
  | "topical"
  | "inhaler"
  | "drops"
  | "other"

export const MEDICATION_FORMS: MedicationForm[] = [
  "tablet",
  "capsule",
  "syrup",
  "injection",
  "topical",
  "inhaler",
  "drops",
  "other",
]

export const MEDICATION_FORM_LABELS: Record<MedicationForm, string> = {
  tablet: "Biji",
  capsule: "Kapsul",
  syrup: "Sirap",
  injection: "Suntikan",
  topical: "Sapuan",
  inhaler: "Sedutan",
  drops: "Titis",
  other: "Lain-lain",
}

/**
 * Satu preskripsi. `quantityLeft` ditulis tangan - menolaknya automatik setiap dos
 * memerlukan kiraan yang betul merentas dos yang terlepas, dan itu Fasa 2.
 */
export type HealthMedication = {
  id: string
  name: string
  form: MedicationForm
  strength?: string
  instructions?: string
  startedOn: string
  endedOn?: string
  isActive: boolean
  quantityLeft?: string
  refillDueOn?: string
  notes?: string
}

/** 1=Isnin ... 7=Ahad, sama seperti ISO. Kosong bermakna setiap hari. */
export const WEEKDAYS: { value: number; short: string }[] = [
  { value: 1, short: "Isn" },
  { value: 2, short: "Sel" },
  { value: 3, short: "Rab" },
  { value: 4, short: "Kha" },
  { value: 5, short: "Jum" },
  { value: 6, short: "Sab" },
  { value: 7, short: "Ahd" },
]

export type HealthSchedule = {
  id: string
  /** "HH:MM" waktu TEMPATAN circle, bukan masa mutlak. */
  timeOfDay: string
  daysOfWeek?: number[]
  doseAmount: string
  doseUnit: string
  withFood?: boolean
  startsOn: string
  endsOn?: string
  isActive: boolean
}

export type DoseStatus = "pending" | "taken" | "missed" | "skipped" | "refused"

export const DOSE_STATUS_LABELS: Record<DoseStatus, string> = {
  pending: "Menunggu",
  taken: "Dah makan",
  missed: "Terlepas",
  skipped: "Dilangkau",
  refused: "Enggan",
}

/**
 * Satu dos pada satu hari. DITERBITKAN daripada jadual, bukan disimpan: tiada rekod
 * wujud sehingga seseorang menandakannya, jadi `status` kosong bermakna "belum".
 */
export type HealthDose = {
  scheduleId: string
  medicationId: string
  name: string
  form?: MedicationForm
  strength?: string
  instructions?: string
  timeOfDay: string
  scheduledAt: string
  doseAmount: string
  doseUnit: string
  withFood?: boolean
  status?: DoseStatus
  recordedAt?: string
  note?: string
}

/** Hari ini sebagai "YYYY-MM-DD" waktu tempatan pelayar, bukan UTC. */
export function todayISO(now = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/**
 * Jenis vital dari katalog global pelayan (7 dimuat turun sekali): tekanan darah,
 * nadi, suhu, berat, tinggi, gula darah, oksigen. Ia bukan rekod person, jadi tiada
 * di sini - hanya rujukan untuk borang dan paparan.
 */
export type VitalType = {
  id: string
  /** Kuncinya stabil antarabangsa ("blood_pressure"), bukan label tempatan. */
  key: string
  name: string
  unit: string
  /** Tekanan darah memakai dua nilai (sistolik/diastolik); lain-lain satu. */
  hasSecondary: boolean
  secondaryUnit?: string
}

/**
 * Satu bacaan vital = satu SNAPSHOT pada satu masa. Tiada kemas kini: salah catat
 * bermakna padam dan catat semula. Pelayan menolak masa hadapan.
 *
 * Unit ialah hak milik jenis; perpuluhan ialah rentetan ("140.500") supaya tiga
 * titik perpuluhan kekal, sama seperti `costAmount`.
 */
export type VitalReading = {
  id: string
  vitalTypeId: string
  valuePrimary: string
  valueSecondary?: string
  measuredAt: string
  note?: string
  createdAt: string
}

/**
 * Satu imunisasi. `givenOn` KOSONG bermakna "belum diberi" - ia satu suntikan
 * berjadual. `nextDueOn` ialah bila suntikan berikutnya (kadang-kadang ada,
 * kadang-kadang tiada).
 */
export type Immunisation = {
  id: string
  vaccine: string
  doseNumber?: number
  givenOn?: string
  batchNo?: string
  nextDueOn?: string
  notes?: string
  createdAt: string
}
