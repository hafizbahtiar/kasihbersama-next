import {
  NATIONAL_IMMUNISATION_SCHEDULE,
  SCHEDULE_VERSION,
} from "@/lib/application/national-immunisation-schedule"
import type {
  GrowthRequirement,
  ImmunisationBook,
  ImmunisationItem,
  ImmunisationRecord,
  ImmunisationStatus,
} from "@/lib/domain/growth"

const CODED_GENDERS = new Set(["male", "female"])

function addMonthsDays(base: Date, months: number, days: number) {
  const due = new Date(base)
  due.setUTCMonth(due.getUTCMonth() + months)
  due.setUTCDate(due.getUTCDate() + days)
  return due
}

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10)
}

function checkReadiness(profile: {
  dateOfBirth?: string
  gender?: string
}): { ready: boolean; missing: GrowthRequirement[] } {
  const missing: GrowthRequirement[] = []
  if (!profile.dateOfBirth?.trim()) {
    missing.push("date_of_birth")
  }
  if (!profile.gender || !CODED_GENDERS.has(profile.gender)) {
    missing.push("gender")
  }
  return { ready: missing.length === 0, missing }
}

/** Merge the static national schedule with profile records (mock / offline). */
export function buildImmunisationBook(
  profile: { dateOfBirth?: string; gender?: string },
  records: ImmunisationRecord[]
): ImmunisationBook {
  const readiness = checkReadiness(profile)
  if (!readiness.ready) {
    return {
      ready: false,
      missing: readiness.missing,
      scheduleVersion: SCHEDULE_VERSION,
      items: [],
    }
  }

  const dob = new Date(`${profile.dateOfBirth}T00:00:00.000Z`)
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const byDose = Object.fromEntries(
    records.map((record) => [record.scheduleDoseId, record])
  )

  const items: ImmunisationItem[] = []
  for (const dose of NATIONAL_IMMUNISATION_SCHEDULE) {
    if (dose.sexFilter && profile.gender !== dose.sexFilter) {
      items.push({
        scheduleDoseId: dose.id,
        vaccine: dose.vaccine,
        label: dose.label,
        status: "not_applicable",
        regionNote: dose.regionNote,
      })
      continue
    }

    const due = addMonthsDays(dob, dose.dueMonths, dose.dueDays)
    const item: ImmunisationItem = {
      scheduleDoseId: dose.id,
      vaccine: dose.vaccine,
      label: dose.label,
      dueDate: isoDate(due),
      regionNote: dose.regionNote,
      status: "pending",
    }

    const record = byDose[dose.id]
    if (record) {
      item.status = "given"
      item.record = record
    } else if (today > due) {
      item.status = "overdue"
    }
    items.push(item)
  }

  return {
    ready: true,
    missing: [],
    scheduleVersion: SCHEDULE_VERSION,
    items,
  }
}

export function immunisationStatusKind(
  status: ImmunisationStatus
): "ok" | "warn" | "danger" | "muted" {
  if (status === "given") {
    return "ok"
  }
  if (status === "overdue") {
    return "danger"
  }
  if (status === "pending") {
    return "warn"
  }
  return "muted"
}
