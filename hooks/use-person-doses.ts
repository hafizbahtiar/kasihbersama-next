"use client"

import { useCallback, useEffect, useState } from "react"

import { getHealthRepository } from "@/lib/composition/health-repository"
import type { HealthDose } from "@/lib/domain/health"
import { ApiError, isApiError } from "@/lib/infrastructure/api/errors"

/**
 * Dos untuk SATU hari.
 *
 * Berasingan daripada `usePersonHealth` kerana ia bergantung pada tarikh yang
 * dipilih: memuatkannya bersama rekod lain bermakna setiap tukar hari memuatkan
 * semula seluruh rekod kesihatan.
 */
export function usePersonDoses(
  circleId: string,
  personId: string,
  date: string
) {
  const [data, setData] = useState<HealthDose[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setData(await getHealthRepository().listDoses(circleId, personId, date))
    } catch (cause) {
      setData([])
      setError(
        isApiError(cause)
          ? cause
          : new ApiError("Gagal memuatkan dos.", {
              code: "internal",
              status: 500,
            })
      )
    } finally {
      setIsLoading(false)
    }
  }, [circleId, personId, date])

  useEffect(() => {
    // Load-on-mount: pemuat menukar isLoading sebelum await pertamanya, yang
    // ditandai oleh peraturan pengkompil. Selamat - satu render tambahan.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  return { data, isLoading, error, reload: load }
}
