"use client"

import { useCallback, useEffect, useState } from "react"

import type { ListParams, PaginatedResult } from "@/lib/domain/pagination"
import {
  ApiError,
  isApiError,
  messageForApiError,
} from "@/lib/infrastructure/api/errors"

type AsyncState<T> = {
  data: T | null
  isLoading: boolean
  error: ApiError | null
}

export function usePaginatedCareResource<T>({
  profileId,
  enabled = true,
  fetcher,
  initialPage = 1,
  initialPerPage = 20,
}: {
  profileId: string | undefined
  enabled?: boolean
  fetcher: (
    profileId: string,
    params: ListParams
  ) => Promise<PaginatedResult<T>>
  initialPage?: number
  initialPerPage?: number
}) {
  const [page, setPage] = useState(initialPage)
  const [perPage, setPerPage] = useState(initialPerPage)
  const [filter, setFilter] = useState<Record<string, string>>({})
  const [state, setState] = useState<AsyncState<PaginatedResult<T>>>({
    data: null,
    isLoading: false,
    error: null,
  })

  const load = useCallback(async () => {
    if (!profileId || !enabled) {
      return
    }
    setState((current) => ({ ...current, isLoading: true, error: null }))
    try {
      const data = await fetcher(profileId, { page, perPage, filter })
      setState({ data, isLoading: false, error: null })
    } catch (cause) {
      const error = isApiError(cause)
        ? cause
        : new ApiError("Gagal memuatkan data.", {
            code: "internal",
            status: 500,
          })
      setState({ data: null, isLoading: false, error })
    }
  }, [enabled, fetcher, filter, page, perPage, profileId])

  useEffect(() => {
    // Load-on-mount: the loader flips isLoading synchronously before its first
    // await, which the compiler rule flags. Safe here - it is one extra render
    // on mount, and the alternative (deferring the flip) would show a stale
    // "loaded" frame first.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  return {
    ...state,
    page,
    perPage,
    filter,
    setPage,
    setPerPage,
    setFilter,
    reload: load,
  }
}
