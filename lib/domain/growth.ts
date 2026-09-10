export const IMMUNISATION_STATUSES = [
  "given",
  "overdue",
  "pending",
  "not_applicable",
] as const

export type ImmunisationStatus = (typeof IMMUNISATION_STATUSES)[number]

export const IMMUNISATION_STATUS_LABELS: Record<ImmunisationStatus, string> = {
  given: "Diberi",
  overdue: "Lewat",
  pending: "Menunggu",
  not_applicable: "Tidak berkenaan",
}

export const GROWTH_REQUIREMENTS = ["date_of_birth", "gender"] as const

export type GrowthRequirement = (typeof GROWTH_REQUIREMENTS)[number]

export const GROWTH_REQUIREMENT_MESSAGES: Record<GrowthRequirement, string> = {
  date_of_birth:
    "Tarikh lahir diperlukan untuk carta pertumbuhan — paksi-x carta ialah umur.",
  gender: "Jantina diperlukan — rujukan WHO berbeza mengikut jantina.",
}

export type ImmunisationRecord = {
  id: string
  scheduleDoseId: string
  givenAt: string
  note?: string
}

export type ImmunisationItem = {
  scheduleDoseId: string
  vaccine: string
  label: string
  dueDate?: string
  status: ImmunisationStatus
  regionNote?: string
  record?: ImmunisationRecord
}

export type ImmunisationBook = {
  ready: boolean
  missing: GrowthRequirement[]
  scheduleVersion: string
  items: ImmunisationItem[]
}

export type RecordImmunisationInput = {
  scheduleDoseId: string
  givenAt: string
  note?: string
}

export type UpdateImmunisationInput = {
  givenAt?: string
  note?: string
}
