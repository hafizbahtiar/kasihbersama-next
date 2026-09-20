"use client"

import { useCallback, useEffect, useState } from "react"

import { getCircleRepository } from "@/lib/composition/circle-repository"
import type { CircleSettings, CircleSettingsPatch } from "@/lib/domain/circle"
import { isApiError, type ApiError } from "@/lib/infrastructure/api/errors"

/**
 * One circle's own settings: name, type, timezone, currency.
 *
 * Read from the circle rather than from bootstrap. Bootstrap's membership row
 * carries no currency, and inventing it there would make two sources for the
 * same facts - which is how the two end up disagreeing.
 *
 * `save` keeps the server's answer as the new state: the form then shows what
 * was stored, not what was typed.
 */
export function useCircleSettings(circleId: string) {
  const [settings, setSettings] = useState<CircleSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setSettings(await getCircleRepository().getCircle(circleId))
    } catch (cause) {
      setSettings(null)
      setError(isApiError(cause) ? cause : null)
    } finally {
      setIsLoading(false)
    }
  }, [circleId])

  const save = useCallback(
    async (patch: CircleSettingsPatch) => {
      setSettings(await getCircleRepository().updateCircle(circleId, patch))
    },
    [circleId]
  )

  useEffect(() => {
    // Load-on-mount: the loader flips isLoading synchronously before its first
    // await, which the compiler rule flags. Safe here - it is one extra render
    // on mount, and the alternative (deferring the flip) would show a stale
    // "loaded" frame first.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  return { settings, isLoading, error, save, reload: load }
}
