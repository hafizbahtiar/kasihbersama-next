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
    "Tarikh lahir diperlukan untuk carta pertumbuhan - paksi-x carta ialah umur.",
  gender: "Jantina diperlukan - rujukan WHO berbeza mengikut jantina.",
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

/**
 * The WHO growth indicators this app plots. Age-indexed all three, so they
 * share one chart shape; weight-for-length and BMI-for-age are not here
 * because their x-axis is not age.
 */
export const GROWTH_INDICATORS = [
  "weight_for_age",
  "length_height_for_age",
  "head_circumference_for_age",
] as const

export type GrowthIndicator = (typeof GROWTH_INDICATORS)[number]

export const GROWTH_INDICATOR_LABELS: Record<GrowthIndicator, string> = {
  weight_for_age: "Berat ikut umur",
  length_height_for_age: "Panjang/tinggi ikut umur",
  head_circumference_for_age: "Lilitan kepala ikut umur",
}

/** One vertex of a reference curve. */
export type GrowthBandPoint = {
  ageDays: number
  value: number
}

/**
 * A reference curve at a fixed number of standard deviations from the median.
 * The server sends -3, -2, 0, +2 and +3.
 */
export type GrowthBand = {
  z: number
  points: GrowthBandPoint[]
}

/**
 * One of the child's measurements.
 *
 * `z` is null when the reading falls outside the reference range, with
 * `reason` saying so. The value is still shown - the parent recorded it - but
 * it carries no score, because extrapolating the curve past its last fitted
 * point produces a confident-looking number that means nothing.
 */
export type GrowthPoint = {
  readingId: string
  readingType: string
  measuredAt: string
  ageDays: number
  plotAgeDays: number
  usesCorrectedAge: boolean
  value: number
  z: number | null
  reason?: string
}

/**
 * A growth chart: the reference bands, and the child plotted against them.
 *
 * Carries no interpretation of the z-scores, and must not grow one. A z-score
 * below -2 SD has a clinical name in the WHO documentation, and putting that
 * word next to a parent's baby is a diagnosis this product does not make. The
 * bands are there so the chart speaks for itself.
 */
export type GrowthChart = {
  indicator: GrowthIndicator
  unit: string
  sex: string
  referenceFromDays: number
  referenceToDays: number
  bands: GrowthBand[]
  points: GrowthPoint[]
}

/** Preconditions unmet: the same vocabulary /growth/readiness returns. */
export type GrowthChartNotReady = {
  kind: "not_ready"
  missing: GrowthRequirement[]
}

/** Milestone domains, as parents and clinics group them. */
export const MILESTONE_DOMAINS = [
  "motor_gross",
  "motor_fine",
  "language",
  "social",
] as const

export type MilestoneDomain = (typeof MILESTONE_DOMAINS)[number]

export const MILESTONE_DOMAIN_LABELS: Record<MilestoneDomain, string> = {
  motor_gross: "Motor kasar",
  motor_fine: "Motor halus",
  language: "Bahasa",
  social: "Sosial",
}

/**
 * Two values, and there will not be a third.
 *
 * The immunisation book has "overdue" because a dose past its due date is a
 * finding a clinic acts on. A milestone not yet reached is normal variation
 * far more often than it is anything, so "not recorded" is the only other
 * state - not "late", not "missed".
 */
export const MILESTONE_STATUSES = ["achieved", "not_recorded"] as const

export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number]

export type MilestoneItem = {
  milestoneId: string
  domain: MilestoneDomain
  label: string
  typicalFromMonths: number
  typicalToMonths: number
  status: MilestoneStatus
  achievedAt?: string
  note?: string
}

/**
 * The checklist for one child.
 *
 * Carries no completion count and must not grow one. A percentage invites
 * comparison against other children, which a wide normal range makes
 * meaningless - and the comparison is what turns a checklist into a verdict.
 */
export type MilestoneBook = {
  ready: boolean
  missing: GrowthRequirement[]
  messages: Partial<Record<GrowthRequirement, string>>
  scheduleVersion: string
  /** "placeholder" until a real reference set is chosen and licensed. */
  source: string
  ageMonths?: number
  items: MilestoneItem[]
}

export type RecordMilestoneInput = {
  milestoneId: string
  achievedAt: string
  note?: string
}
