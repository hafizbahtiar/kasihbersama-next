/**
 * Penjagaan (docs/15): apa yang berlaku HARI INI - arahan tetap, dan kemudian
 * catatan harian dan giliran jaga pada hirisan seterusnya. Sempadan dengan
 * health: dos berjadual milik health, pemerhatian milik care (docs/00 §7).
 */

export type CareNeedCategory =
  | "mobiliti"
  | "pemakanan"
  | "kebersihan"
  | "komunikasi"
  | "ubat"
  | "keselamatan"
  | "tidur"
  | "emosi"
  | "lain"

export const CARE_NEED_CATEGORIES: CareNeedCategory[] = [
  "mobiliti",
  "pemakanan",
  "kebersihan",
  "komunikasi",
  "ubat",
  "keselamatan",
  "tidur",
  "emosi",
  "lain",
]

export const CARE_NEED_CATEGORY_LABELS: Record<CareNeedCategory, string> = {
  mobiliti: "Mobiliti",
  pemakanan: "Pemakanan",
  kebersihan: "Kebersihan",
  komunikasi: "Komunikasi",
  ubat: "Ubat",
  keselamatan: "Keselamatan",
  tidur: "Tidur",
  emosi: "Emosi",
  lain: "Lain-lain",
}

export type CareNeedPriority = "kritikal" | "penting" | "biasa"

export const CARE_NEED_PRIORITIES: CareNeedPriority[] = [
  "kritikal",
  "penting",
  "biasa",
]

export const CARE_NEED_PRIORITY_LABELS: Record<CareNeedPriority, string> = {
  kritikal: "Kritikal",
  penting: "Penting",
  biasa: "Biasa",
}

/**
 * SATU arahan tetap - "Perlu dipapah ke tandas", "Tidak boleh makan makanan
 * keras". Ayat, bukan kod. `isActive` menutup arahan yang tidak lagi relevan
 * tanpa memadam sejarahnya; yang kritikal disenaraikan dahulu oleh pelayan.
 *
 * Nota digugurkan pelayan pada akses `summary`; arahan, kategori dan keutamaan
 * kekal kerana itulah maklumat keselamatan (docs/15 §7).
 */
export type CareNeed = {
  id: string
  category: CareNeedCategory
  instruction: string
  priority: CareNeedPriority
  note?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}
export type CareLogKind =
  | "makan"
  | "minum"
  | "tidur"
  | "ubat"
  | "mood"
  | "aktiviti"
  | "kebersihan"
  | "gejala"
  | "kejadian"
  | "lawatan"
  | "nota"

export const CARE_LOG_KIND_LABELS: Record<CareLogKind, string> = {
  nota: "Nota",
  makan: "Makan",
  minum: "Minum",
  tidur: "Tidur",
  ubat: "Ubat",
  mood: "Mood",
  aktiviti: "Aktiviti",
  kebersihan: "Kebersihan",
  gejala: "Gejala",
  kejadian: "Kejadian",
  lawatan: "Lawatan",
}

export const CARE_LOG_KINDS = Object.keys(CARE_LOG_KIND_LABELS) as CareLogKind[]

export type CareLogFlag = "biasa" | "perlu_perhatian" | "kecemasan"

export const CARE_LOG_FLAG_LABELS: Record<CareLogFlag, string> = {
  biasa: "Biasa",
  perlu_perhatian: "Perlu perhatian",
  kecemasan: "Kecemasan",
}

export const CARE_LOG_FLAGS = Object.keys(CARE_LOG_FLAG_LABELS) as CareLogFlag[]

/**
 * `circle` sesiapa yang boleh membaca person itu, `penjaga` akses penuh sahaja,
 * `penulis` penulisnya sahaja - untuk pemerhatian yang belum pasti.
 */
export type CareLogVisibility = "circle" | "penjaga" | "penulis"

export const CARE_LOG_VISIBILITY_LABELS: Record<CareLogVisibility, string> = {
  circle: "Semua dalam circle",
  penjaga: "Penjaga sahaja",
  penulis: "Saya sahaja",
}

export const CARE_LOG_VISIBILITIES = Object.keys(
  CARE_LOG_VISIBILITY_LABELS
) as CareLogVisibility[]

/**
 * SATU catatan penjagaan: apa yang berlaku, bila ia BERLAKU (bukan bila
 * ditaip), dan siapa memerhati. Pelayan menggugurkan tajuk/isi pada akses
 * `summary`, dan isi sahaja bila polisi field `care.log.body` tidak membenarkan
 * baca - kosong di sini bermakna disembunyikan, bukan tiada.
 */
export type CareLog = {
  id: string
  kind: CareLogKind
  title?: string
  body?: string
  flag: CareLogFlag
  visibility: CareLogVisibility
  occurredAt: string
  recordedBy?: string
  recordedByLabel?: string
  createdAt: string
  updatedAt: string
}

export type CareLogInput = {
  kind: CareLogKind
  title: string
  body: string
  flag: CareLogFlag
  visibility: CareLogVisibility
  occurredAt: string
}

export type CareShiftStatus =
  | "dijadualkan"
  | "berjalan"
  | "selesai"
  | "terlepas"
  | "dibatalkan"
  | "digantikan"

export const CARE_SHIFT_STATUS_LABELS: Record<CareShiftStatus, string> = {
  dijadualkan: "Dijadualkan",
  berjalan: "Sedang jaga",
  selesai: "Selesai",
  terlepas: "Terlepas",
  dibatalkan: "Dibatalkan",
  digantikan: "Diganti",
}

/**
 * SATU giliran menjaga: "Along jaga mak Sabtu 8 pagi-6 petang". Penjaga ialah
 * person, bukan ahli - orang yang menjaga tidak semestinya ada akaun, jadi
 * sesiapa dalam keluarga boleh menandakan mula/habis untuknya.
 * `replacedShiftId` menunjuk giliran asal bila seseorang mengambil alih.
 */
export type CareShift = {
  id: string
  caregiverPersonId: string
  caregiverName: string
  startsAt: string
  endsAt: string
  status: CareShiftStatus
  startedAt?: string
  endedAt?: string
  handoverNote?: string
  handoverAt?: string
  replacedShiftId?: string
  note?: string
}

export type CareShiftInput = {
  caregiverPersonId: string
  startsAt: string
  endsAt: string
  note: string
}
