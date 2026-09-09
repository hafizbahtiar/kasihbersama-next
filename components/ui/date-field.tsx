"use client"

import * as React from "react"
import { cn } from "cn"
import {
  DateField as DateFieldPrimitive,
  DateInput as DateInputPrimitive,
  DateSegment as DateSegmentPrimitive,
  TimeField as TimeFieldPrimitive,
  composeRenderProps,
} from "react-aria-components"
import {
  CalendarDate,
  CalendarDateTime,
  Time,
  parseDate,
  parseDateTime,
  parseTime,
} from "@internationalized/date"

/**
 * Date and time entry built on react-aria-components, matching the Input
 * styling so a form does not visibly change size or focus behaviour when a
 * field switches to one of these.
 *
 * The project's shadcn style (aria-nova) ships a Calendar but no date-field,
 * date-picker or time-field, so these are assembled from the RAC primitives
 * the Calendar already depends on.
 *
 * The public API is string in, string out - "YYYY-MM-DD", "YYYY-MM-DDTHH:mm",
 * "HH:mm" - the same shapes the native inputs produced. Every form here keeps
 * its value as a string and hands it straight to the API, so converting at
 * the boundary keeps twelve call sites unchanged instead of pushing
 * @internationalized/date objects through form state.
 */

const inputStyles =
  "flex h-8 w-full min-w-0 items-center rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30 data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20 dark:data-invalid:border-destructive/50 dark:data-invalid:ring-destructive/40"

const segmentStyles =
  "rounded px-0.5 tabular-nums caret-transparent outline-none type-literal:px-0 type-literal:text-muted-foreground data-focused:bg-primary data-focused:text-primary-foreground data-placeholder:text-muted-foreground"

function DateInput({ className }: { className?: string }) {
  return (
    <DateInputPrimitive
      data-slot="date-input"
      className={composeRenderProps(className, (className) =>
        cn(inputStyles, className)
      )}
    >
      {(segment) => (
        <DateSegmentPrimitive segment={segment} className={segmentStyles} />
      )}
    </DateInputPrimitive>
  )
}

/** Parses leniently: a half-typed or empty value is null, never a throw. */
function safeParse<T>(raw: string | undefined, parse: (s: string) => T) {
  if (!raw) return null
  try {
    return parse(raw)
  } catch {
    return null
  }
}

/** "YYYY-MM-DD" */
export function DateField({
  value,
  onChange,
  className,
  isInvalid,
  "aria-label": ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  className?: string
  isInvalid?: boolean
  "aria-label"?: string
}) {
  return (
    <DateFieldPrimitive
      aria-label={ariaLabel}
      isInvalid={isInvalid}
      granularity="day"
      value={safeParse(value, parseDate)}
      onChange={(next) =>
        onChange(
          next
            ? new CalendarDate(next.year, next.month, next.day).toString()
            : ""
        )
      }
      className="w-full"
    >
      <DateInput className={className} />
    </DateFieldPrimitive>
  )
}

/** "YYYY-MM-DDTHH:mm" - the shape input[type=datetime-local] produced. */
export function DateTimeField({
  value,
  onChange,
  className,
  isInvalid,
  "aria-label": ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  className?: string
  isInvalid?: boolean
  "aria-label"?: string
}) {
  return (
    <DateFieldPrimitive
      aria-label={ariaLabel}
      isInvalid={isInvalid}
      granularity="minute"
      // Matches TimeField and the stored value, both 24-hour. Left to the
      // locale, ms-MY renders AM/PM here while TimeField beside it showed
      // 14:30 - the same time written two ways in one form.
      hourCycle={24}
      hideTimeZone
      value={safeParse(value, parseDateTime)}
      onChange={(next) => {
        if (!next) {
          onChange("")
          return
        }
        const d = new CalendarDateTime(
          next.year,
          next.month,
          next.day,
          "hour" in next ? next.hour : 0,
          "minute" in next ? next.minute : 0
        )
        // toString() would append ":00" seconds; the API and the native input
        // both used minute precision.
        onChange(d.toString().slice(0, 16))
      }}
      className="w-full"
    >
      <DateInput className={className} />
    </DateFieldPrimitive>
  )
}

/** "HH:mm" */
export function TimeField({
  value,
  onChange,
  className,
  isInvalid,
  "aria-label": ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  className?: string
  isInvalid?: boolean
  "aria-label"?: string
}) {
  return (
    <TimeFieldPrimitive
      aria-label={ariaLabel}
      isInvalid={isInvalid}
      hourCycle={24}
      value={safeParse(value, parseTime)}
      onChange={(next) =>
        onChange(
          next ? new Time(next.hour, next.minute).toString().slice(0, 5) : ""
        )
      }
      className="w-full"
    >
      <DateInput className={className} />
    </TimeFieldPrimitive>
  )
}

export { DateInput }
