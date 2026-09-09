"use client"

import { useCallback, useEffect, useState } from "react"

import { getCareRepository } from "@/lib/composition/care-repository"
import type { AuditEvent, CareSummary } from "@/lib/domain/care"
import type { PaginatedResult } from "@/lib/domain/pagination"
import { ApiError, normalizeApiError } from "@/lib/infrastructure/api/errors"

const emptyPage = <T>(): PaginatedResult<T> => ({
  data: [],
  total: 0,
  page: 1,
  perPage: 20,
  totalPages: 0,
  hasMore: false,
})

/**
 * A care profile's administrative history.
 *
 * Server-paginated: this table only grows, so the page is the unit here rather
 * than a full list held in memory.
 */
export function useAuditEvents(profileId: string | undefined) {
  const [page, setPage] = useState(1)
  const [result, setResult] =
    useState<PaginatedResult<AuditEvent>>(emptyPage<AuditEvent>())
  const [isLoading, setIsLoading] = useState(Boolean(profileId))
  const [error, setError] = useState<ApiError | null>(null)

  const load = useCallback(async () => {
    if (!profileId) {
      setResult(emptyPage<AuditEvent>())
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      setResult(await getCareRepository().listAuditEvents(profileId, { page }))
    } catch (cause) {
      setError(normalizeApiError(cause))
      setResult(emptyPage<AuditEvent>())
    } finally {
      setIsLoading(false)
    }
  }, [profileId, page])

  useEffect(() => {
    // Load-on-mount: the loader flips isLoading synchronously before its first
    // await, which the compiler rule flags. Safe here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  return { ...result, isLoading, error, page, setPage, reload: load }
}

/** Stored doctor-visit summaries for a profile, plus the create action. */
export function useSummaries(profileId: string | undefined) {
  const [result, setResult] =
    useState<PaginatedResult<CareSummary>>(emptyPage<CareSummary>())
  const [isLoading, setIsLoading] = useState(Boolean(profileId))
  const [error, setError] = useState<ApiError | null>(null)

  const load = useCallback(async () => {
    if (!profileId) {
      setResult(emptyPage<CareSummary>())
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      setResult(await getCareRepository().listSummaries(profileId))
    } catch (cause) {
      setError(normalizeApiError(cause))
      setResult(emptyPage<CareSummary>())
    } finally {
      setIsLoading(false)
    }
  }, [profileId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const create = useCallback(
    async (period: { periodStart: string; periodEnd: string }) => {
      if (!profileId) {
        throw new ApiError("Pilih profil jagaan dahulu.", {
          code: "invalid_argument",
          status: 400,
        })
      }
      const created = await getCareRepository().createSummary(profileId, period)
      await load()
      return created
    },
    [profileId, load]
  )

  return { ...result, isLoading, error, reload: load, create }
}
