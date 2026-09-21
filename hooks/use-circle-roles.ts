"use client"

import { useCallback, useEffect, useState } from "react"

import { getCircleRepository } from "@/lib/composition/circle-repository"
import type { CircleRole } from "@/lib/domain/circle"
import { ApiError, isApiError } from "@/lib/infrastructure/api/errors"

/** System + custom roles of one circle. Writes reload, like the member list. */
export function useCircleRoles(circleId: string) {
  const [data, setData] = useState<CircleRole[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setData(await getCircleRepository().listRoles(circleId))
    } catch (cause) {
      setError(
        isApiError(cause)
          ? cause
          : new ApiError("Gagal memuatkan peranan.", {
              code: "internal",
              status: 500,
            })
      )
      setData([])
    } finally {
      setIsLoading(false)
    }
  }, [circleId])

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
