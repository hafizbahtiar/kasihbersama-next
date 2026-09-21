"use client"

import { useCallback, useEffect, useState } from "react"

import { getHealthRepository } from "@/lib/composition/health-repository"
import type {
  HealthAllergy,
  HealthCondition,
  HealthProfile,
} from "@/lib/domain/health"
import { ApiError, isApiError } from "@/lib/infrastructure/api/errors"

type State = {
  profile: HealthProfile
  profileExists: boolean
  conditions: HealthCondition[]
  allergies: HealthAllergy[]
}

const EMPTY: State = {
  profile: {},
  profileExists: false,
  conditions: [],
  allergies: [],
}

/**
 * Satu rekod kesihatan person: kad kecemasan, keadaan, alahan.
 *
 * Ketiga-tiganya dimuatkan bersama kerana skrin memaparkan ketiga-tiganya, dan
 * tiga keadaan memuat berasingan bermakna tiga kerangka yang berkelip.
 */
export function usePersonHealth(circleId: string, personId: string) {
  const [data, setData] = useState<State>(EMPTY)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const repo = getHealthRepository()
      const [profile, conditions, allergies] = await Promise.all([
        repo.getProfile(circleId, personId),
        repo.listConditions(circleId, personId),
        repo.listAllergies(circleId, personId),
      ])
      setData({
        profile: profile.profile,
        profileExists: profile.exists,
        conditions,
        allergies,
      })
    } catch (cause) {
      setData(EMPTY)
      setError(
        isApiError(cause)
          ? cause
          : new ApiError("Gagal memuatkan rekod kesihatan.", {
              code: "internal",
              status: 500,
            })
      )
    } finally {
      setIsLoading(false)
    }
  }, [circleId, personId])

  useEffect(() => {
    // Load-on-mount: the loader flips isLoading synchronously before its first
    // await, which the compiler rule flags. Safe here - it is one extra render
    // on mount, and the alternative (deferring the flip) would show a stale
    // "loaded" frame first.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  return { ...data, isLoading, error, reload: load }
}
