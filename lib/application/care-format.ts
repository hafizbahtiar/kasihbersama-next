import { parseDate, startOfWeek } from "@internationalized/date"

import type { TimelineItem } from "@/lib/domain/care"
import {
  DOCUMENT_TYPE_LABELS,
  EVENT_STATUS_LABELS,
  LOG_TYPE_OPTIONS,
  VITAL_TYPE_OPTIONS,
} from "@/lib/domain/care"
import type { CareSnapshot } from "@/lib/domain/care-snapshot"

export function buildTimeline(
  snapshot: CareSnapshot,
  profileId: string
): TimelineItem[] {
  const items: TimelineItem[] = []
  const medicationName = Object.fromEntries(
    snapshot.medications.map((item) => [item.id, item.name])
  )

  for (const log of snapshot.logs.filter((item) => item.profileId === profileId)) {
    items.push({
      id: `log:${log.id}`,
      profileId,
      occurredAt: log.occurredAt,
      kind: "log",
      title: log.title,
      body: log.body,
      meta:
        LOG_TYPE_OPTIONS.find((item) => item.value === log.logType)?.label ??
        log.logType,
    })
  }

  for (const event of snapshot.events.filter((item) => item.profileId === profileId)) {
    items.push({
      id: `med:${event.id}`,
      profileId,
      occurredAt: event.expectedAt,
      kind: "medication",
      title: medicationName[event.medicationId] ?? "Ubat",
      body: EVENT_STATUS_LABELS[event.actionStatus],
      meta: event.note,
    })
  }

  for (const appointment of snapshot.appointments.filter(
    (item) => item.profileId === profileId
  )) {
    items.push({
      id: `apt:${appointment.id}`,
      profileId,
      occurredAt: appointment.appointmentAt,
      kind: "appointment",
      title: appointment.title,
      body: appointment.location,
      meta: appointment.doctorName,
    })
  }

  for (const vital of snapshot.vitals.filter((item) => item.profileId === profileId)) {
    const typeLabel =
      VITAL_TYPE_OPTIONS.find((item) => item.value === vital.readingType)?.label ??
      vital.readingType
    const value =
      vital.systolic != null && vital.diastolic != null
        ? `${vital.systolic}/${vital.diastolic} ${vital.unit ?? ""}`
        : `${vital.valueNumeric ?? vital.valueText ?? ""} ${vital.unit ?? ""}`

    items.push({
      id: `vit:${vital.id}`,
      profileId,
      occurredAt: vital.measuredAt,
      kind: "vital",
      title: typeLabel,
      body: value.trim(),
      meta: vital.note,
    })
  }

  for (const task of snapshot.tasks.filter((item) => item.profileId === profileId)) {
    items.push({
      id: `task:${task.id}`,
      profileId,
      occurredAt: task.dueAt,
      kind: "task",
      title: task.title,
      body: task.description,
      meta: task.assignedToName,
    })
  }

  for (const document of snapshot.documents.filter(
    (item) => item.profileId === profileId
  )) {
    items.push({
      id: `doc:${document.id}`,
      profileId,
      occurredAt: document.createdAt,
      kind: "document",
      title: document.title,
      body: DOCUMENT_TYPE_LABELS[document.documentType],
      meta: document.filename,
    })
  }

  return items.sort(
    (left, right) =>
      new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()
  )
}

export const CARE_TIME_ZONE = "Asia/Kuala_Lumpur"

function dateTimeParts(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CARE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ""

  return {
    year: get("year"),
    month: get("month").padStart(2, "0"),
    day: get("day").padStart(2, "0"),
    hour: get("hour").padStart(2, "0"),
    minute: get("minute").padStart(2, "0"),
  }
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ms-MY", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: CARE_TIME_ZONE,
  }).format(new Date(value))
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("ms-MY", {
    dateStyle: "medium",
    timeZone: CARE_TIME_ZONE,
  }).format(new Date(value))
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat("ms-MY", {
    timeStyle: "short",
    timeZone: CARE_TIME_ZONE,
  }).format(new Date(value))
}

export function formatFullDate(value: string) {
  const date = value.includes("T")
    ? new Date(value)
    : new Date(`${value}T00:00:00+08:00`)

  return new Intl.DateTimeFormat("ms-MY", {
    dateStyle: "full",
    timeZone: CARE_TIME_ZONE,
  }).format(date)
}

export function dateKey(value: string) {
  const { year, month, day } = dateTimeParts(new Date(value))
  return `${year}-${month}-${day}`
}

export function todayKey() {
  return dateKey(new Date().toISOString())
}

export function shiftDateKey(key: string, days: number) {
  return parseDate(key).add({ days }).toString()
}

export function weekDateKeys(anchor: string) {
  const start = startOfWeek(parseDate(anchor), "ms-MY", "mon")
  return Array.from({ length: 7 }, (_, index) =>
    start.add({ days: index }).toString()
  )
}

export function formatWeekRange(anchor: string) {
  const days = weekDateKeys(anchor)
  const start = new Date(`${days[0]}T00:00:00+08:00`)
  const end = new Date(`${days[6]}T00:00:00+08:00`)
  const sameMonth = days[0].slice(0, 7) === days[6].slice(0, 7)

  if (sameMonth) {
    const monthYear = new Intl.DateTimeFormat("ms-MY", {
      month: "long",
      year: "numeric",
      timeZone: CARE_TIME_ZONE,
    }).format(end)
    return `${parseDate(days[0]).day}–${parseDate(days[6]).day} ${monthYear}`
  }

  const startLabel = new Intl.DateTimeFormat("ms-MY", {
    day: "numeric",
    month: "short",
    timeZone: CARE_TIME_ZONE,
  }).format(start)
  const endLabel = new Intl.DateTimeFormat("ms-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: CARE_TIME_ZONE,
  }).format(end)
  return `${startLabel} – ${endLabel}`
}

export function formatWeekdayShort(key: string) {
  return new Intl.DateTimeFormat("ms-MY", {
    weekday: "short",
    timeZone: CARE_TIME_ZONE,
  }).format(new Date(`${key}T00:00:00+08:00`))
}

export function toDateTimeLocalValue(value: Date | string = new Date()) {
  const date = typeof value === "string" ? new Date(value) : value
  const { year, month, day, hour, minute } = dateTimeParts(date)
  return `${year}-${month}-${day}T${hour}:${minute}`
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function nextId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}
