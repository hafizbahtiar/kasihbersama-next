"use client"

import { useCallback, useEffect, useState } from "react"

import { getCareRepository } from "@/lib/composition/care-repository"
import type { CareNeed } from "@/lib/domain/care"
import { ApiError, isApiError } from "@/lib/infrastructure/api/errors"

/**
 * Arahan tetap seorang person. Dimuat dalam komponennya sendiri, bukan bersama
 * rekod kesihatan: care ialah module berasingan (docs/15), dan memuatkannya
 * dalam hook health bermakna menukar tab memuatkan data yang tidak dipapar.
 */
export function usePersonNeeds(circleId: string, personId: string) {
  const [needs, setNeeds] = useState<CareNeed[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setNeeds(await getCareRepository().listNeeds(circleId, personId))
    } catch (cause) {
      setNeeds([])
      setError(
        isApiError(cause)
          ? cause
          : new ApiError("Gagal memuatkan arahan tetap.", {
              code: "internal",
              status: 500,
            })
      )
    } finally {
      setIsLoading(false)
    }
  }, [circleId, personId])

  useEffect(() => {
    // Load-on-mount: sama seperti use-person-health - satu render tambahan
    // pada pemasangan, dan alternatifnya menunjukkan kerangka "sudah dimuat"
    // yang basi dahulu.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  return { needs, isLoading, error, reload: load }
}