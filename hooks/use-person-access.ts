"use client"

import { useCallback, useEffect, useState } from "react"

import { getCircleRepository } from "@/lib/composition/circle-repository"
import type { PersonAccessGrant } from "@/lib/domain/circle"
import { isApiError, type ApiError } from "@/lib/infrastructure/api/errors"

/**
 * Who may see one person.
 *
 * The dialog mounts per person and unmounts when it closes, so this loads once
 * on mount rather than tracking an "open" flag.
 */
export function usePersonAccess(circleId: string, personId: string) {
  const [data, setData] = useState<PersonAccessGrant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setData(
        await getCircleRepository().listPersonAccess(circleId, personId)
      )
    } catch (cause) {
      setData([])
      setError(isApiError(cause) ? cause : null)
    } finally {
      setIsLoading(false)
    }
  }, [circleId, personId])

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
