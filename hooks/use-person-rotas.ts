"use client"

import { useCallback, useEffect, useState } from "react"

import { getCareRepository } from "@/lib/composition/care-repository"
import type { CareRota } from "@/lib/domain/care"
import { ApiError, isApiError } from "@/lib/infrastructure/api/errors"

/** Jadual giliran berulang seorang person - senarai kecil, dimuat sekaligus. */
export function usePersonRotas(circleId: string, personId: string) {
  const [rotas, setRotas] = useState<CareRota[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setRotas(await getCareRepository().listRotas(circleId, personId))
    } catch (cause) {
      setRotas([])
      setError(
        isApiError(cause)
          ? cause
          : new ApiError("Gagal memuatkan jadual giliran.", {
              code: "internal",
              status: 500,
            })
      )
    } finally {
      setIsLoading(false)
    }
  }, [circleId, personId])

  useEffect(() => {
    // Load-on-mount: sama seperti use-person-needs.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  return { rotas, isLoading, error, reload: load }
}
