"use client"

import { useCallback, useEffect, useState } from "react"

import { getHealthRepository } from "@/lib/composition/health-repository"
import type {
  HealthAllergy,
  HealthAppointment,
  HealthCondition,
  HealthProfile,
  HealthVisit,
} from "@/lib/domain/health"
import { ApiError, isApiError } from "@/lib/infrastructure/api/errors"

type State = {
  profile: HealthProfile
  profileExists: boolean
  conditions: HealthCondition[]
  allergies: HealthAllergy[]
  appointments: HealthAppointment[]
  visits: HealthVisit[]
}

const EMPTY: State = {
  profile: {},
  profileExists: false,
  conditions: [],
  allergies: [],
  appointments: [],
  visits: [],
}

/**
 * Satu rekod kesihatan person: kad kecemasan, keadaan, alahan, janji temu,
 * lawatan.
 *
 * Semuanya dimuatkan bersama kerana skrin memaparkan semuanya dalam tab, dan
 * lima keadaan memuat berasingan bermakna kerangka yang berkelip setiap kali
 * tab ditukar.
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
      const [profile, conditions, allergies, appointments, visits] =
        await Promise.all([
          repo.getProfile(circleId, personId),
          repo.listConditions(circleId, personId),
          repo.listAllergies(circleId, personId),
          repo.listAppointments(circleId, personId),
          repo.listVisits(circleId, personId),
        ])
      setData({
        profile: profile.profile,
        profileExists: profile.exists,
        conditions,
        allergies,
        appointments,
        visits,
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
