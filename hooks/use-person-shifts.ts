"use client"

import { useCallback, useEffect, useState } from "react"

import { getCareRepository } from "@/lib/composition/care-repository"
import type { CareShift } from "@/lib/domain/care"
import { ApiError, isApiError } from "@/lib/infrastructure/api/errors"

/** Saiz halaman pelayan (care.ShiftPageSize). Halaman penuh = mungkin ada lagi. */
const PAGE_SIZE = 50

function asApiError(cause: unknown) {
  return isApiError(cause)
    ? cause
    : new ApiError("Gagal memuatkan giliran menjaga.", {
        code: "internal",
        status: 500,
      })
}

/**
 * Giliran menjaga seorang person, terkini dahulu. Tumbuh setiap minggu, jadi
 * dimuat sehalaman demi sehalaman seperti catatan.
 */
export function usePersonShifts(circleId: string, personId: string) {
  const [shifts, setShifts] = useState<CareShift[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const page = await getCareRepository().listShifts(circleId, personId)
      setShifts(page)
      setHasMore(page.length === PAGE_SIZE)
    } catch (cause) {
      setShifts([])
      setError(asApiError(cause))
    } finally {
      setIsLoading(false)
    }
  }, [circleId, personId])

  async function loadMore() {
    const last = shifts.at(-1)
    if (!last) return
    setIsLoading(true)
    try {
      const page = await getCareRepository().listShifts(
        circleId,
        personId,
        last
      )
      setShifts((current) => [...current, ...page])
      setHasMore(page.length === PAGE_SIZE)
    } catch (cause) {
      setError(asApiError(cause))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Load-on-mount: sama seperti use-person-logs.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  return { shifts, hasMore, isLoading, error, reload: load, loadMore }
}
