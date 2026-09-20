"use client"

import { toast } from "sonner"

import { AsyncStateBanner } from "@/components/shared/async-state"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useDisplayFormat,
  useDisplayPreferences,
} from "@/lib/application/display-preferences"
import type { UserSettingsPatch } from "@/lib/domain/account"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"

/**
 * The account's display preferences: date pattern, 12h/24h, week start.
 *
 * Two `user_settings` columns deliberately have no control here. `theme` lives
 * with `next-themes` (`components/theme-provider.tsx`), and `UserSettingsPatch`
 * leaves it out so a second writer cannot compile. `distance_unit` has nothing
 * to change: no screen in this app renders a distance.
 */

/**
 * Patterns offered for `date_format`. The backend only checks it is non-empty,
 * so the vocabulary is ours - the schema default plus the neighbours people
 * ask for, all built from the tokens `useDisplayFormat` resolves. Anything
 * stored that is not in this list is still offered, so the control never opens
 * blank on a value another client wrote.
 */
const DATE_FORMATS = ["dd/MM/yyyy", "d MMM yyyy", "d MMMM yyyy", "yyyy-MM-dd"]

const TIME_FORMATS = [
  { id: "12h", label: "12 jam" },
  { id: "24h", label: "24 jam" },
] as const

/** ISO weekday, 1 = Isnin … 7 = Ahad. Only real week starts are offered. */
const WEEK_STARTS = [
  { id: "1", label: "Isnin" },
  { id: "7", label: "Ahad" },
] as const

/** One fixed instant for the previews, so they never drift by the minute. */
const PREVIEW_AT = "2026-01-05T13:30:00+08:00"

export function DisplaySection() {
  const { settings, isLoading, error, save } = useDisplayPreferences()
  const { date, time } = useDisplayFormat()

  const dateFormats =
    settings && !DATE_FORMATS.includes(settings.dateFormat)
      ? [settings.dateFormat, ...DATE_FORMATS]
      : DATE_FORMATS
  // Non-1/7 is treated as Monday, exactly as `useDisplayFormat` reads it.
  const weekStart = settings?.weekStartsOn === 7 ? "7" : "1"

  async function persist(patch: UserSettingsPatch) {
    try {
      await save(patch)
      toast.success("Tetapan paparan disimpan.")
    } catch (cause) {
      // Nothing to roll back: the only value shown is the one the provider got
      // from the server, so a failed save leaves the control on the stored
      // value and this toast is the whole error surface.
      toast.error(
        isApiError(cause)
          ? messageForApiError(cause)
          : "Gagal menyimpan tetapan paparan."
      )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paparan</CardTitle>
        <CardDescription>
          Cara tarikh, masa dan minggu dipaparkan di seluruh aplikasi.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <AsyncStateBanner
          error={error}
          label="Gagal memuatkan tetapan paparan."
        />

        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : settings ? (
          <FieldGroup>
            <Field>
              <FieldLabel>Format tarikh</FieldLabel>
              <Select
                className="w-full"
                aria-label="Format tarikh"
                value={settings.dateFormat}
                onChange={(key) => {
                  void persist({ dateFormat: String(key ?? "") })
                }}
              >
                <SelectTrigger size="xl" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateFormats.map((pattern) => (
                    <SelectItem key={pattern} id={pattern}>
                      {pattern}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>Contoh: {date(PREVIEW_AT)}</FieldDescription>
            </Field>

            <Field>
              <FieldLabel>Format masa</FieldLabel>
              <Select
                className="w-full"
                aria-label="Format masa"
                value={settings.timeFormat}
                onChange={(key) => {
                  if (key === "12h" || key === "24h") {
                    void persist({ timeFormat: key })
                  }
                }}
              >
                <SelectTrigger size="xl" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_FORMATS.map((option) => (
                    <SelectItem key={option.id} id={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>Contoh: {time(PREVIEW_AT)}</FieldDescription>
            </Field>

            <Field>
              <FieldLabel>Hari mula minggu</FieldLabel>
              <Select
                className="w-full"
                aria-label="Hari mula minggu"
                value={weekStart}
                onChange={(key) => {
                  const value = Number(key)
                  if (value === 1 || value === 7) {
                    void persist({ weekStartsOn: value })
                  }
                }}
              >
                <SelectTrigger size="xl" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEK_STARTS.map((option) => (
                    <SelectItem key={option.id} id={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                Minggu bermula pada hari ini dalam kalendar dan senarai tugas.
              </FieldDescription>
            </Field>
          </FieldGroup>
        ) : null}
      </CardContent>
    </Card>
  )
}
