"use client"

import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import type { ApiError } from "@/lib/infrastructure/api/errors"
import { messageForApiError } from "@/lib/infrastructure/api/errors"

export function AsyncStateBanner({
  error,
  onRetry,
  label = "Gagal memuatkan data.",
}: {
  error: ApiError | null
  onRetry?: () => void
  label?: string
}) {
  if (!error) {
    return null
  }

  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm"
    >
      <div className="flex items-start gap-2 text-destructive">
        <IconAlertTriangle className="mt-0.5 size-4 shrink-0" />
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-destructive/90">{messageForApiError(error)}</p>
        </div>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onPress={onRetry}>
          <IconRefresh />
          Cuba lagi
        </Button>
      ) : null}
    </div>
  )
}

export function AuthErrorBanner({
  error,
  onRetry,
  onDismiss,
}: {
  error: ApiError | null
  onRetry?: () => void
  onDismiss?: () => void
}) {
  if (!error) {
    return null
  }

  const throttled =
    error.code === "rate_limited" ||
    error.code === "locked" ||
    error.status === 429

  return (
    <div
      role="alert"
      className={
        throttled
          ? "rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
          : "rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
      }
    >
      <p className="font-medium">
        {throttled ? "Terlalu banyak percubaan" : "Ralat pengesahan"}
      </p>
      <p>{messageForApiError(error)}</p>
      <div className="mt-3 flex gap-2">
        {onRetry ? (
          <Button variant="outline" size="sm" onPress={onRetry}>
            <IconRefresh />
            Cuba lagi
          </Button>
        ) : null}
        {onDismiss ? (
          <Button variant="ghost" size="sm" onPress={onDismiss}>
            Tutup
          </Button>
        ) : null}
      </div>
    </div>
  )
}
