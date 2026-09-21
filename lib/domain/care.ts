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