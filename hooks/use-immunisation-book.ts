"use client"

import { useCallback, useEffect, useState } from "react"

import { getGrowthRepository } from "@/lib/composition/growth-repository"
import type { ImmunisationBook } from "@/lib/domain/growth"
import { ApiError, isApiError } from "@/lib/infrastructure/api/errors"

type AsyncState = {
  data: ImmunisationBook | null
  isLoading: boolean
  error: ApiError | null
}

export function useImmunisationBook(profileId: string | undefined) {
  const [state, setState] = useState<AsyncState>({
    data: null,
    isLoading: false,
    error: null,
  })

  const load = useCallback(async () => {
    if (!profileId) {
      return
    }
    setState((current) => ({ ...current, isLoading: true, error: null }))
    try {
      const data = await getGrowthRepository().getImmunisationBook(profileId)
      setState({ data, isLoading: false, error: null })
    } catch (cause) {
      const error = isApiError(cause)
        ? cause
        : new ApiError("Gagal memuatkan buku imunisasi.", {
            code: "internal",
            status: 500,
          })
      setState({ data: null, isLoading: false, error })
    }
  }, [profileId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  return { ...state, reload: load }
}
