"use client"

import { useCallback, useEffect, useState } from "react"

import { getCircleRepository } from "@/lib/composition/circle-repository"
import type { CircleMember } from "@/lib/domain/circle"
import { ApiError, isApiError } from "@/lib/infrastructure/api/errors"

/**
 * One circle's members. Every write reloads rather than patching locally: a
 * role change moves what the server will allow next, and a list that guessed
 * would disagree with the next request.
 */
export function useCircleMembers(circleId: string) {
  const [data, setData] = useState<CircleMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // One page: a circle is a family - dozens of members, not thousands.
      // When one really is large, the cursor is already in the envelope.
      const page = await getCircleRepository().listMembers(circleId)
      setData(page.data)
    } catch (cause) {
      setError(
        isApiError(cause)
          ? cause
          : new ApiError("Gagal memuatkan ahli.", {
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
