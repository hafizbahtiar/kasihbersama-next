import { Badge } from "@/components/ui/badge"
import {
  APPOINTMENT_STATUS_LABELS,
  EVENT_STATUS_LABELS,
  MEDICATION_STATUS_LABELS,
  MEMBER_STATUS_LABELS,
  PROFILE_STATUS_LABELS,
  TASK_STATUS_LABELS,
  type AppointmentStatus,
  type EventStatus,
  type MedicationStatus,
  type MemberStatus,
  type ProfileStatus,
  type TaskStatus,
} from "@/lib/domain/care"

function tone(
  kind: "ok" | "warn" | "danger" | "muted"
): "default" | "secondary" | "destructive" | "outline" {
  if (kind === "ok") {
    return "default"
  }
  if (kind === "danger") {
    return "destructive"
  }
  if (kind === "warn") {
    return "outline"
  }
  return "secondary"
}

export function ProfileStatusBadge({ value }: { value: ProfileStatus }) {
  return (
    <Badge variant={value === "active" ? "default" : "secondary"}>
      {PROFILE_STATUS_LABELS[value]}
    </Badge>
  )
}

export function MemberStatusBadge({ value }: { value: MemberStatus }) {
  return (
    <Badge variant={value === "active" ? "default" : "secondary"}>
      {MEMBER_STATUS_LABELS[value]}
    </Badge>
  )
}

export function MedicationStatusBadge({ value }: { value: MedicationStatus }) {
  return (
    <Badge
      variant={tone(
        value === "active" ? "ok" : value === "paused" ? "warn" : "muted"
      )}
    >
      {MEDICATION_STATUS_LABELS[value]}
    </Badge>
  )
}

export function EventStatusBadge({ value }: { value: EventStatus }) {
  const kind =
    value === "taken"
      ? "ok"
      : value === "missed"
        ? "danger"
        : value === "pending"
          ? "warn"
          : "muted"
  return <Badge variant={tone(kind)}>{EVENT_STATUS_LABELS[value]}</Badge>
}

/**
 * How much attention each appointment status deserves.
 *
 * Exported because the month calendar colours its day indicators from the
 * same source. Two copies of this mapping would eventually disagree, and a
 * calendar that paints a missed appointment in the "done" colour is worse
 * than one with no colour at all.
 */
export const APPOINTMENT_STATUS_KIND: Record<
  AppointmentStatus,
  "ok" | "muted" | "danger"
> = {
  scheduled: "ok",
  completed: "muted",
  cancelled: "muted",
  missed: "danger",
}

export function AppointmentStatusBadge({
  value,
}: {
  value: AppointmentStatus
}) {
  return (
    <Badge variant={tone(APPOINTMENT_STATUS_KIND[value])}>
      {APPOINTMENT_STATUS_LABELS[value]}
    </Badge>
  )
}

export function TaskStatusBadge({ value }: { value: TaskStatus }) {
  const kind =
    value === "completed"
      ? "ok"
      : value === "cancelled"
        ? "muted"
        : value === "in_progress"
          ? "warn"
          : "muted"
  return <Badge variant={tone(kind)}>{TASK_STATUS_LABELS[value]}</Badge>
}
