"use client"

import { useCallback, useEffect, useState } from "react"

import { getCareRepository } from "@/lib/composition/care-repository"
import type { CareLog } from "@/lib/domain/care"
import { ApiError, isApiError } from "@/lib/infrastructure/api/errors"

/** Saiz halaman pelayan (care.LogPageSize). Halaman penuh = mungkin ada lagi. */
const PAGE_SIZE = 50

function asApiError(cause: unknown) {
  return isApiError(cause)
    ? cause
    : new ApiError("Gagal memuatkan catatan penjagaan.", {
        code: "internal",
        status: 500,
      })
}

/**
 * Garis masa catatan seorang person. Satu-satunya senarai care yang tumbuh
 * setiap hari, jadi ia dimuat sehalaman demi sehalaman dan bukan sekaligus.
 */
export function usePersonLogs(circleId: string, personId: string) {
  const [logs, setLogs] = useState<CareLog[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const page = await getCareRepository().listLogs(circleId, personId)
      setLogs(page)
      setHasMore(page.length === PAGE_SIZE)
    } catch (cause) {
      setLogs([])
      setError(asApiError(cause))
    } finally {
      setIsLoading(false)
    }
  }, [circleId, personId])

  async function loadMore() {
    const last = logs.at(-1)
    if (!last) return
    setIsLoading(true)
    try {
      const page = await getCareRepository().listLogs(circleId, personId, last)
      setLogs((current) => [...current, ...page])
      setHasMore(page.length === PAGE_SIZE)
    } catch (cause) {
      setError(asApiError(cause))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Load-on-mount: sama seperti use-person-needs.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  return { logs, hasMore, isLoading, error, reload: load, loadMore }
}
