"use client"

import * as React from "react"
import { IconCalendar } from "@tabler/icons-react"
import { parseDate } from "@internationalized/date"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverTrigger } from "@/components/ui/popover"
import { DateField, DateTimeField, TimeField } from "@/components/ui/date-field"
import { cn } from "@/lib/utils"

/**
 * The shadcn date-picker: a composition of Popover and Calendar behind a
 * Button trigger, per ui.shadcn.com/docs/components/base/date-picker. There is
 * no registry item for it - it is a documented pattern assembled from
 * components the project already has, which is why `shadcn add date-picker`
 * reports it missing.
 *
 * The docs' sample code uses react-day-picker, date-fns and lucide. None of
 * those are installed here and none are needed: this project's Calendar is the
 * react-aria one, so the pattern is composed over that instead.
 *
 * A typed field sits beside the calendar rather than being replaced by it.
 * Paging a month grid is the wrong tool for a date of birth seventy years back,
 * and typing is the wrong tool for "which Tuesday" - a picker that offers only
 * one of the two makes one of those tasks tedious.
 *
 * String in, string out, matching the native inputs these replaced.
 */
export function DatePicker({
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
  const [isOpen, setIsOpen] = React.useState(false)

  let calendarValue = null
  try {
    calendarValue = value ? parseDate(value) : null
  } catch {
    calendarValue = null
  }

  return (
    <div className={cn("flex w-full items-center gap-1.5", className)}>
      <DateField
        value={value}
        onChange={onChange}
        isInvalid={isInvalid}
        aria-label={ariaLabel}
      />
      <PopoverTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
        <Button
          variant="outline"
          size="icon"
          aria-label="Pilih dari kalendar"
          className="shrink-0"
        >
          <IconCalendar />
        </Button>
        <Popover className="w-auto p-3">
          <Calendar
            aria-label={ariaLabel ?? "Kalendar"}
            captionLayout="dropdown"
            headerFormat={{ month: "long", year: "numeric" }}
            value={calendarValue}
            onChange={(next) => {
              if (next) {
                onChange(next.toString())
                setIsOpen(false)
              }
            }}
          />
        </Popover>
      </PopoverTrigger>
    </div>
  )
}

/**
 * Same pattern for a date and a time. The calendar sets the day and leaves the
 * time segments alone, so choosing a different day does not silently reset a
 * time the user already entered.
 */
export function DateTimePicker({
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
  const [isOpen, setIsOpen] = React.useState(false)
  const [datePart, timePart] = value ? value.split("T") : ["", ""]

  let calendarValue = null
  try {
    calendarValue = datePart ? parseDate(datePart) : null
  } catch {
    calendarValue = null
  }

  return (
    <div className={cn("flex w-full items-center gap-1.5", className)}>
      <DateTimeField
        value={value}
        onChange={onChange}
        isInvalid={isInvalid}
        aria-label={ariaLabel}
      />
      <PopoverTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
        <Button
          variant="outline"
          size="icon"
          aria-label="Pilih dari kalendar"
          className="shrink-0"
        >
          <IconCalendar />
        </Button>
        <Popover className="w-auto p-3">
          <Calendar
            aria-label={ariaLabel ?? "Kalendar"}
            captionLayout="dropdown"
            headerFormat={{ month: "long", year: "numeric" }}
            value={calendarValue}
            onChange={(next) => {
              if (next) {
                onChange(`${next.toString()}T${timePart || "09:00"}`)
                setIsOpen(false)
              }
            }}
          />
        </Popover>
      </PopoverTrigger>
    </div>
  )
}

export { TimeField }
