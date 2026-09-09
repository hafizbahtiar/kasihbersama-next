"use client"

import { useMemo, useState } from "react"
import {
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
} from "@tabler/icons-react"

import { AppointmentCard } from "@/components/care/appointment-card"
import { CareCalendar } from "@/components/care/care-calendar"
import { APPOINTMENT_STATUS_KIND } from "@/components/care/status-badges"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  dateKey,
  formatFullDate,
  formatTime,
  formatWeekRange,
  formatWeekdayShort,
  shiftDateKey,
  todayKey,
  weekDateKeys,
} from "@/lib/application/care-format"
import type { Appointment, AppointmentStatus } from "@/lib/domain/care"
import { cn } from "@/lib/utils"

type CalendarView = "month" | "week" | "day"

const EDGE_CLASS: Record<"ok" | "muted" | "danger", string> = {
  ok: "border-l-primary",
  muted: "border-l-muted-foreground/50",
  danger: "border-l-destructive",
}

export function AppointmentCalendar({
  appointments,
  selectedDay,
  onSelectDay,
  onCreate,
  onStatus,
  isRefreshing,
}: {
  appointments: Appointment[]
  selectedDay: string
  onSelectDay: (day: string) => void
  onCreate: () => void
  onStatus: (id: string, status: AppointmentStatus) => void
  isRefreshing?: boolean
}) {
  const [view, setView] = useState<CalendarView>("month")
  const today = todayKey()
  const isAwayFromToday = selectedDay !== today
  const selectedView = useMemo(() => new Set([view]), [view])

  const byDay = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    for (const item of appointments) {
      const key = dateKey(item.appointmentAt)
      const bucket = map.get(key)
      if (bucket) {
        bucket.push(item)
      } else {
        map.set(key, [item])
      }
    }
    for (const bucket of map.values()) {
      bucket.sort((a, b) => a.appointmentAt.localeCompare(b.appointmentAt))
    }
    return map
  }, [appointments])

  const dayStatuses = useMemo(() => {
    const map = new Map<string, AppointmentStatus[]>()
    for (const [key, items] of byDay) {
      map.set(
        key,
        items.map((item) => item.status)
      )
    }
    return map
  }, [byDay])

  const weekDays = useMemo(() => weekDateKeys(selectedDay), [selectedDay])
  const dayAppointments = byDay.get(selectedDay) ?? []

  function goToday() {
    onSelectDay(today)
    setView("month")
  }

  function shift(days: number) {
    onSelectDay(shiftDateKey(selectedDay, days))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <ToggleGroup
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={selectedView}
            onSelectionChange={(keys) => {
              const next = keys.values().next().value
              if (next === "month" || next === "week" || next === "day") {
                setView(next)
              }
            }}
            variant="outline"
            spacing={0}
            aria-label="Paparan kalendar"
          >
            <ToggleGroupItem id="month">Bulan</ToggleGroupItem>
            <ToggleGroupItem id="week">Minggu</ToggleGroupItem>
            <ToggleGroupItem id="day">Hari</ToggleGroupItem>
          </ToggleGroup>

          {isAwayFromToday ? (
            <Button variant="outline" onPress={goToday}>
              Hari ini
            </Button>
          ) : null}

          {view !== "month" ? (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label={
                  view === "week" ? "Minggu sebelumnya" : "Hari sebelumnya"
                }
                onPress={() => shift(view === "week" ? -7 : -1)}
              >
                <IconChevronLeft />
              </Button>
              <p className="min-w-52 px-1 text-center text-sm font-medium">
                {view === "week"
                  ? formatWeekRange(selectedDay)
                  : formatFullDate(selectedDay)}
              </p>
              <Button
                variant="ghost"
                size="icon"
                aria-label={
                  view === "week" ? "Minggu seterusnya" : "Hari seterusnya"
                }
                onPress={() => shift(view === "week" ? 7 : 1)}
              >
                <IconChevronRight />
              </Button>
            </div>
          ) : null}
        </div>

        <div className="shrink-0">
          <Button onPress={onCreate}>
            <IconPlus />
            Tambah temujanji
          </Button>
        </div>
      </div>

      <div aria-busy={isRefreshing}>
        {view === "month" ? (
          <MonthView
            selectedDay={selectedDay}
            onSelectDay={onSelectDay}
            dayStatuses={dayStatuses}
            dayAppointments={dayAppointments}
            onStatus={onStatus}
          />
        ) : null}
        {view === "week" ? (
          <WeekView
            days={weekDays}
            selectedDay={selectedDay}
            today={today}
            byDay={byDay}
            onSelectDay={onSelectDay}
            onOpenDay={(day) => {
              onSelectDay(day)
              setView("day")
            }}
          />
        ) : null}
        {view === "day" ? (
          <DayView
            selectedDay={selectedDay}
            appointments={dayAppointments}
            onStatus={onStatus}
          />
        ) : null}
      </div>
    </div>
  )
}

function MonthView({
  selectedDay,
  onSelectDay,
  dayStatuses,
  dayAppointments,
  onStatus,
}: {
  selectedDay: string
  onSelectDay: (day: string) => void
  dayStatuses: Map<string, AppointmentStatus[]>
  dayAppointments: Appointment[]
  onStatus: (id: string, status: AppointmentStatus) => void
}) {
  const selectedLabel = formatFullDate(selectedDay)

  return (
    <div className="grid gap-4 xl:grid-cols-[20rem_minmax(0,1fr)]">
      <CareCalendar
        selectedDay={selectedDay}
        onSelectDay={onSelectDay}
        dayStatuses={dayStatuses}
      />
      <Card>
        <CardHeader>
          <CardTitle>{selectedLabel}</CardTitle>
          <CardDescription>
            {dayAppointments.length === 0
              ? "Hari ini lapang."
              : `${dayAppointments.length} temujanji`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {dayAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Pilih hari lain pada kalendar, atau tambah temujanji baharu untuk
              hari ini.
            </p>
          ) : (
            dayAppointments.map((item) => (
              <AppointmentCard
                key={item.id}
                appointment={item}
                onStatus={(status) => onStatus(item.id, status)}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function WeekView({
  days,
  selectedDay,
  today,
  byDay,
  onSelectDay,
  onOpenDay,
}: {
  days: string[]
  selectedDay: string
  today: string
  byDay: Map<string, Appointment[]>
  onSelectDay: (day: string) => void
  onOpenDay: (day: string) => void
}) {
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[56rem] grid-cols-7 divide-x overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        {days.map((day) => {
          const items = byDay.get(day) ?? []
          const isSelected = day === selectedDay
          const isToday = day === today
          const dateNumber = Number(day.slice(8))

          return (
            <section
              key={day}
              className={cn(
                "flex min-h-[22rem] flex-col",
                isSelected && "bg-muted/40"
              )}
            >
              <button
                type="button"
                onClick={() => onSelectDay(day)}
                className="flex flex-col items-center gap-1 border-b px-2 py-2.5 text-center"
                aria-current={isToday ? "date" : undefined}
                aria-pressed={isSelected}
              >
                <span className="text-xs text-muted-foreground">
                  {formatWeekdayShort(day)}
                </span>
                <span
                  className={cn(
                    "grid size-7 place-items-center rounded-full text-sm tabular-nums",
                    isToday && "bg-primary text-primary-foreground",
                    isSelected && !isToday && "bg-foreground/10"
                  )}
                >
                  {dateNumber}
                </span>
              </button>
              <div className="flex flex-1 flex-col gap-1.5 p-1.5">
                {items.length === 0 ? (
                  <p className="px-1 py-2 text-xs text-muted-foreground">—</p>
                ) : (
                  items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onOpenDay(day)}
                      className={cn(
                        "rounded-md border-l-2 bg-muted/70 px-2 py-1.5 text-left",
                        EDGE_CLASS[APPOINTMENT_STATUS_KIND[item.status]]
                      )}
                    >
                      <p className="text-[0.7rem] leading-none text-muted-foreground tabular-nums">
                        {formatTime(item.appointmentAt)}
                      </p>
                      <p className="mt-1 truncate text-sm font-medium">
                        {item.title}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function DayView({
  selectedDay,
  appointments,
  onStatus,
}: {
  selectedDay: string
  appointments: Appointment[]
  onStatus: (id: string, status: AppointmentStatus) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{formatFullDate(selectedDay)}</CardTitle>
        <CardDescription>
          {appointments.length === 0
            ? "Tiada temujanji pada hari ini."
            : `${appointments.length} temujanji`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {appointments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Tambah temujanji baharu, atau pilih hari lain.
          </p>
        ) : (
          appointments.map((item) => (
            <AppointmentCard
              key={item.id}
              appointment={item}
              onStatus={(status) => onStatus(item.id, status)}
            />
          ))
        )}
      </CardContent>
    </Card>
  )
}
