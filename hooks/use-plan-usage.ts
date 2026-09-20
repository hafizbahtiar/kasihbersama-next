"use client"

import { useCallback, useEffect, useState } from "react"

import { getAccountRepository } from "@/lib/composition/account-repository"
import type { PlanUsage } from "@/lib/domain/account"
import { isApiError, type ApiError } from "@/lib/infrastructure/api/errors"

/**
 * The account's plan, its ceilings, and what has been used.
 *
 * Read from `/me/usage` rather than bootstrap, because bootstrap answers "what do I
 * need before the first screen" and does not count anybody's persons. The circle is
 * passed in: the per-circle counts belong to whichever circle the caller is looking at.
 */
export function usePlanUsage(circleId?: string) {
  const [data, setData] = useState<PlanUsage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setData(await getAccountRepository().getUsage(circleId))
    } catch (cause) {
      setData(null)
      setError(isApiError(cause) ? cause : null)
    } finally {
      setIsLoading(false)
    }
  }, [circleId])

  useEffect(() => {
    // Load-on-mount: the loader flips isLoading synchronously before its first await,
    // which the compiler rule flags. Safe here - one extra render on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  return { data, isLoading, error, reload: load }
}
