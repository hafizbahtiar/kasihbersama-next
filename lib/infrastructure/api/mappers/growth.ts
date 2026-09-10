import { GROWTH_INDICATORS, MILESTONE_DOMAINS } from "@/lib/domain/growth"
import type {
  ImmunisationBook,
  ImmunisationItem,
  ImmunisationRecord,
  ImmunisationStatus,
  GrowthRequirement,
  GrowthChart,
  GrowthIndicator,
  MilestoneBook,
  MilestoneDomain,
  MilestoneItem,
} from "@/lib/domain/growth"

type ApiImmunisationRecord = {
  id: string
  schedule_dose_id: string
  given_at: string
  note?: string
}

type ApiImmunisationItem = {
  schedule_dose_id: string
  vaccine: string
  label: string
  due_date?: string
  status: ImmunisationStatus
  region_note?: string
  record?: ApiImmunisationRecord
}

export type ApiImmunisationBook = {
  ready: boolean
  missing?: GrowthRequirement[]
  messages?: Record<string, string>
  schedule_version: string
  items?: ApiImmunisationItem[]
}

function mapRecord(row: ApiImmunisationRecord): ImmunisationRecord {
  return {
    id: row.id,
    scheduleDoseId: row.schedule_dose_id,
    givenAt: row.given_at,
    note: row.note,
  }
}

function mapItem(row: ApiImmunisationItem): ImmunisationItem {
  return {
    scheduleDoseId: row.schedule_dose_id,
    vaccine: row.vaccine,
    label: row.label,
    dueDate: row.due_date,
    status: row.status,
    regionNote: row.region_note,
    record: row.record ? mapRecord(row.record) : undefined,
  }
}

export function mapImmunisationBook(row: ApiImmunisationBook): ImmunisationBook {
  return {
    ready: row.ready,
    missing: row.missing ?? [],
    scheduleVersion: row.schedule_version,
    items: (row.items ?? []).map(mapItem),
  }
}

export type ApiGrowthChart = {
  indicator: string
  unit: string
  sex: string
  reference_from_days: number
  reference_to_days: number
  bands: Array<{ z: number; points: Array<{ age_days: number; value: number }> }>
  points: Array<{
    reading_id: string
    reading_type: string
    measured_at: string
    age_days: number
    plot_age_days: number
    uses_corrected_age: boolean
    value: number
    z: number | null
    reason?: string
  }>
}

export function mapGrowthChart(api: ApiGrowthChart): GrowthChart {
  return {
    indicator: asGrowthIndicator(api.indicator),
    unit: api.unit,
    sex: api.sex,
    referenceFromDays: api.reference_from_days,
    referenceToDays: api.reference_to_days,
    bands: (api.bands ?? []).map((band) => ({
      z: band.z,
      points: (band.points ?? []).map((point) => ({
        ageDays: point.age_days,
        value: point.value,
      })),
    })),
    points: (api.points ?? []).map((point) => ({
      readingId: point.reading_id,
      readingType: point.reading_type,
      measuredAt: point.measured_at,
      ageDays: point.age_days,
      plotAgeDays: point.plot_age_days,
      usesCorrectedAge: point.uses_corrected_age,
      value: point.value,
      // null, not 0. The server sends null for a reading outside the
      // reference range, and coercing it to a number would plot an
      // out-of-range measurement as if it scored exactly at the median.
      z: point.z ?? null,
      reason: point.reason || undefined,
    })),
  }
}

function asGrowthIndicator(value: string): GrowthIndicator {
  return (GROWTH_INDICATORS as readonly string[]).includes(value)
    ? (value as GrowthIndicator)
    : "weight_for_age"
}

type ApiMilestoneItem = {
  milestone_id: string
  domain: string
  label: string
  typical_from_months: number
  typical_to_months: number
  status: string
  achieved_at?: string
  note?: string
}

export type ApiMilestoneBook = {
  ready: boolean
  missing?: string[]
  messages?: Record<string, string>
  schedule_version: string
  source: string
  age_months?: number
  items: ApiMilestoneItem[]
}

export function mapMilestoneItem(api: ApiMilestoneItem): MilestoneItem {
  return {
    milestoneId: api.milestone_id,
    domain: (MILESTONE_DOMAINS as readonly string[]).includes(api.domain)
      ? (api.domain as MilestoneDomain)
      : "motor_gross",
    label: api.label,
    typicalFromMonths: api.typical_from_months,
    typicalToMonths: api.typical_to_months,
    // Anything unrecognised reads as not recorded, never as achieved. Marking
    // something achieved that the server did not say was achieved is the one
    // direction this must not fail in.
    status: api.status === "achieved" ? "achieved" : "not_recorded",
    achievedAt: api.achieved_at || undefined,
    note: api.note || undefined,
  }
}

export function mapMilestoneBook(api: ApiMilestoneBook): MilestoneBook {
  return {
    ready: Boolean(api.ready),
    missing: (api.missing ?? []) as GrowthRequirement[],
    messages: (api.messages ?? {}) as Partial<
      Record<GrowthRequirement, string>
    >,
    scheduleVersion: api.schedule_version,
    source: api.source,
    ageMonths: api.age_months,
    items: (api.items ?? []).map(mapMilestoneItem),
  }
}
