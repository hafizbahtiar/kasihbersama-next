import type {
  ImmunisationBook,
  ImmunisationItem,
  ImmunisationRecord,
  ImmunisationStatus,
  GrowthRequirement,
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
