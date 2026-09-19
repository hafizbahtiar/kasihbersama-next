"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { CARE_TIME_ZONE } from "@/lib/application/care-format"
import { getAccountRepository } from "@/lib/composition/account-repository"
import {
  DEFAULT_USER_SETTINGS,
  type TimeFormat,
  type UserSettings,
  type UserSettingsPatch,
} from "@/lib/domain/account"
import {
  normalizeApiError,
  type ApiError,
} from "@/lib/infrastructure/api/errors"

/**
 * Date-pattern tokens the formatter understands.
 *
 * `date_format` is a free-form string the backend only checks is non-empty, so
 * the vocabulary lives here. These are the tokens `dd/MM/yyyy` - the schema
 * default - is built from, plus the obvious neighbours: `d`/`dd` (day), `M`/`MM`
 * (numeric month), `MMM`/`MMMM` (month name in the `ms-MY` locale), `yy`/`yyyy`
 * (year). Anything else in the pattern is passed through as a literal, so an
 * unrecognised pattern still renders rather than throwing or coming back empty.
 */
const DATE_TOKEN = /yyyy|yy|MMMM|MMM|MM|M|dd|d/g

function calendarParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CARE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ""

  return {
    year: get("year"),
    month: get("month").padStart(2, "0"),
    day: get("day").padStart(2, "0"),
  }
}

function monthName(date: Date, width: "short" | "long") {
  return new Intl.DateTimeFormat("ms-MY", {
    timeZone: CARE_TIME_ZONE,
    month: width,
  }).format(date)
}

function formatDateValue(value: string, pattern: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    // A formatter must never throw. Intl throws a RangeError on an Invalid
    // Date, so an unparseable value is echoed unchanged instead.
    return value
  }
  const { year, month, day } = calendarParts(date)

  return pattern.replace(DATE_TOKEN, (token) => {
    switch (token) {
      case "yyyy":
        return year
      case "yy":
        return year.slice(-2)
      case "MMMM":
        return monthName(date, "long")
      case "MMM":
        return monthName(date, "short")
      case "MM":
        return month
      case "M":
        return String(Number(month))
      case "dd":
        return day
      case "d":
        return String(Number(day))
      default:
        return token
    }
  })
}

function formatTimeValue(value: string, timeFormat: TimeFormat) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  // Only the 12h/24h choice moves: the `ms-MY` locale and the care time zone
  // stay exactly as the rest of the app formats them.
  return new Intl.DateTimeFormat("ms-MY", {
    timeZone: CARE_TIME_ZONE,
    timeStyle: "short",
    hour12: timeFormat !== "24h",
  }).format(date)
}

/**
 * ISO `week_starts_on` (1 = Monday … 7 = Sunday) to the day the week layouts
 * start on. The app only offers Monday or Sunday; any other ISO value (which
 * no control produces, but the column allows) falls back to Monday, the schema
 * default.
 */
function weekStartCode(weekStartsOn: number): "mon" | "sun" {
  return weekStartsOn === 7 ? "sun" : "mon"
}

export type DisplayPreferences = {
  settings: UserSettings | null
  isLoading: boolean
  error: ApiError | null
  save(patch: UserSettingsPatch): Promise<void>
}

const DisplayPreferencesContext = createContext<DisplayPreferences | null>(null)

export function DisplayPreferencesProvider({
  children,
}: {
  children: ReactNode
}) {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  useEffect(() => {
    let cancelled = false
    // No synchronous setState in the effect body: isLoading starts true and the
    // load only settles from the async callbacks below.
    void (async () => {
      try {
        const next = await getAccountRepository().getSettings()
        if (!cancelled) {
          setSettings(next)
        }
      } catch (cause) {
        if (!cancelled) {
          setError(normalizeApiError(cause))
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const save = useCallback(async (patch: UserSettingsPatch) => {
    // The response is the authority: local state is set from what the backend
    // stored, never from the patch the caller sent.
    setSettings(await getAccountRepository().updateSettings(patch))
  }, [])

  const value = useMemo<DisplayPreferences>(
    () => ({ settings, isLoading, error, save }),
    [error, isLoading, save, settings]
  )

  return (
    <DisplayPreferencesContext.Provider value={value}>
      {children}
    </DisplayPreferencesContext.Provider>
  )
}

export function useDisplayPreferences() {
  const context = useContext(DisplayPreferencesContext)
  if (!context) {
    throw new Error("DisplayPreferencesProvider diperlukan.")
  }
  return context
}

/**
 * Formatting that follows the account's display preferences.
 *
 * Deliberately tolerant of a missing provider and of settings that have not
 * loaded yet: this is called from screens outside the authenticated shell too,
 * and the schema defaults are a perfectly good answer until a real one exists.
 * It never throws and never renders empty.
 */
export function useDisplayFormat(): {
  date(value: string): string
  time(value: string): string
  dateTime(value: string): string
  weekStartsOn: "mon" | "sun"
} {
  const context = useContext(DisplayPreferencesContext)
  const settings = context?.settings ?? null
  const dateFormat = settings?.dateFormat ?? DEFAULT_USER_SETTINGS.dateFormat
  const timeFormat = settings?.timeFormat ?? DEFAULT_USER_SETTINGS.timeFormat
  const weekStartsOn =
    settings?.weekStartsOn ?? DEFAULT_USER_SETTINGS.weekStartsOn

  return useMemo(
    () => ({
      date: (value: string) => formatDateValue(value, dateFormat),
      time: (value: string) => formatTimeValue(value, timeFormat),
      dateTime: (value: string) =>
        `${formatDateValue(value, dateFormat)}, ${formatTimeValue(
          value,
          timeFormat
        )}`,
      weekStartsOn: weekStartCode(weekStartsOn),
    }),
    [dateFormat, timeFormat, weekStartsOn]
  )
}
