"use client"

import { useCallback, useEffect, useState } from "react"

import { getCircleRepository } from "@/lib/composition/circle-repository"
import type { CirclePerson } from "@/lib/domain/circle"
import { isApiError, type ApiError } from "@/lib/infrastructure/api/errors"

/**
 * The persons one member may see.
 *
 * An empty list is a normal answer, not a failure: the server filters by
 * `person_access`, so a member with no grant on anyone legitimately sees
 * nobody. A 403 is dropped for the same reason invitations drop it - the
 * section is hidden by permission, and a toast would name nothing the reader
 * can act on.
 */
export function useCirclePersons(circleId: string, enabled: boolean) {
  const [data, setData] = useState<CirclePerson[]>([])
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
      setData(await getCircleRepository().listPersons(circleId))
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
