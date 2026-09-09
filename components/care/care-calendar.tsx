"use client"

import { parseDate } from "@internationalized/date"

import { APPOINTMENT_STATUS_KIND } from "@/components/care/status-badges"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useHydrated } from "@/hooks/use-hydrated"
import type { AppointmentStatus } from "@/lib/domain/care"
import { cn } from "@/lib/utils"

/** Indicators shown per day before the row collapses into a "+N" count. */
const MAX_DOTS = 3

export function CareCalendar({
  selectedDay,
  onSelectDay,
  dayStatuses,
  className,
}: {
  selectedDay: string
  onSelectDay: (day: string) => void
  /** Every appointment's status for a day, keyed YYYY-MM-DD, in time order. */
  dayStatuses?: Map<string, AppointmentStatus[]>
  className?: string
}) {
  const hydrated = useHydrated()

  return (
    <Card className={cn("min-w-0", className)}>
      <CardContent className="p-4 sm:p-5">
        {hydrated ? (
          <Calendar
            key={selectedDay}
            aria-label="Kalendar temujanji"
            // --cell-size acts as a minimum here, not a fixed size: the grid
            // is w-full inside a fixed-width column, so cells settle at a
            // seventh of the available width and stay square.
            className="w-full max-w-none p-0 [--cell-size:--spacing(9)]"
            captionLayout="dropdown"
            headerFormat={{ month: "long", year: "numeric" }}
            value={parseDate(selectedDay)}
            onChange={(value) => {
              if (value) {
                onSelectDay(value.toString())
              }
            }}
            renderCell={({ date, formattedDate, isSelected }) => (
              <DayCell
                label={formattedDate}
                statuses={dayStatuses?.get(date.toString()) ?? []}
                isSelected={isSelected}
              />
            )}
          />
        ) : (
          <Skeleton className="h-[19rem] w-full rounded-xl" />
        )}
      </CardContent>
    </Card>
  )
}

/**
 * One day in the month grid: the date, and a fixed-height row of indicators.
 *
 * The wrapper is a div rather than a fragment of spans on purpose. The cell
 * in components/ui/calendar.tsx styles its direct span children as secondary
 * text (`[&>span]:text-xs [&>span]:opacity-70`), which is right for a small
 * label under a date but wrong for the date itself. Returning bare spans from
 * renderCell silently demoted every numeral in the calendar to 12px at 70%
 * opacity. Nesting them one level down keeps that selector off them without
 * having to edit the shadcn primitive, which a `shadcn add` would overwrite.
 */
function DayCell({
  label,
  statuses,
  isSelected,
}: {
  label: string
  statuses: AppointmentStatus[]
  isSelected: boolean
}) {
  // Past MAX_DOTS, drop one dot to make room for the counter so the row's
  // width stays predictable instead of growing with a busy day.
  const shown =
    statuses.length > MAX_DOTS ? statuses.slice(0, MAX_DOTS - 1) : statuses
  const overflow = statuses.length - shown.length

  return (
    <div className="flex size-full flex-col items-center justify-center gap-1">
      <span className="text-sm leading-none tabular-nums">{label}</span>
      {/* Always rendered, even when empty: a reserved row stops the numerals
          from shifting up and down as you move between quiet and busy days. */}
      <span
        aria-hidden="true"
        className="flex h-2.5 items-center justify-center gap-[3px]"
      >
        {shown.map((status, index) => (
          <StatusDot
            key={`${status}-${index}`}
            status={status}
            isSelected={isSelected}
          />
        ))}
        {overflow > 0 ? (
          <span
            className={cn(
              "text-[0.625rem] leading-none font-medium tabular-nums",
              isSelected
                ? "text-primary-foreground/80"
                : "text-muted-foreground"
            )}
          >
            +{overflow}
          </span>
        ) : null}
      </span>
    </div>
  )
}

/**
 * Solid and hollow variants are spelled out per tone rather than layering a
 * `bg-transparent` override, because two utilities from the same group leave
 * the winner up to stylesheet order.
 */
const DOT_CLASS: Record<
  "ok" | "muted" | "danger",
  { solid: string; hollow: string }
> = {
  ok: { solid: "border-primary bg-primary", hollow: "border-primary" },
  muted: {
    solid: "border-muted-foreground bg-muted-foreground",
    hollow: "border-muted-foreground",
  },
  danger: {
    solid: "border-destructive bg-destructive",
    hollow: "border-destructive",
  },
}

/** On a selected day the cell fills with primary, so the tones invert. */
const SELECTED_DOT_CLASS = {
  solid: "border-primary-foreground bg-primary-foreground",
  hollow: "border-primary-foreground/70",
}

function StatusDot({
  status,
  isSelected,
}: {
  status: AppointmentStatus
  isSelected: boolean
}) {
  // A cancelled appointment reads as an outline: something was planned for
  // this day, and it is not happening.
  const variant = status === "cancelled" ? "hollow" : "solid"
  const tone = isSelected
    ? SELECTED_DOT_CLASS
    : DOT_CLASS[APPOINTMENT_STATUS_KIND[status]]

  return <span className={cn("size-1.5 rounded-full border", tone[variant])} />
}
