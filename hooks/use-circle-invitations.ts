"use client"

import { useCallback, useEffect, useState } from "react"

import { getCircleRepository } from "@/lib/composition/circle-repository"
import type { CircleInvitation } from "@/lib/domain/circle"
import { isApiError, type ApiError } from "@/lib/infrastructure/api/errors"

/**
 * Pending invitations for one circle.
 *
 * A 403 is not an error worth shouting about here: reading invitations is its
 * own permission, and a member who lacks it should simply not see the section.
 */
export function useCircleInvitations(circleId: string, enabled: boolean) {
  const [data, setData] = useState<CircleInvitation[]>([])
  const [isLoading, setIsLoading] = useState(enabled)
  const [error, setError] = useState<ApiError | null>(null)

  const load = useCallback(async () => {
    if (!enabled) {
      setData([])
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      setData(await getCircleRepository().listInvitations(circleId))
    } catch (cause) {
      setData([])
      setError(isApiError(cause) && cause.status !== 403 ? cause : null)
    } finally {
      setIsLoading(false)
    }
  }, [circleId, enabled])

  useEffect(() => {
    // Load-on-mount: the loader flips isLoading synchronously before its first
    // await, which the compiler rule flags. Safe here - it is one extra render
    // on mount, and the alternative (deferring the flip) would show a stale
    // "loaded" frame first.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  return { data, isLoading, error, reload: load }
}
