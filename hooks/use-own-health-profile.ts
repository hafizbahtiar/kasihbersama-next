"use client"

import { useCallback, useEffect, useState } from "react"

import { getCareRepository } from "@/lib/composition/care-repository"
import type { CareProfile, ProfileHealthInfo } from "@/lib/domain/care"
import {
  ApiError,
  isApiError,
  normalizeApiError,
} from "@/lib/infrastructure/api/errors"

/**
 * The signed-in user's own health record.
 *
 * `profile: null` after loading is not an error - it means the record has not
 * been set up yet, which is the state the page turns into its setup prompt.
 */
export function useOwnHealthProfile() {
  const [profile, setProfile] = useState<CareProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setProfile(await getCareRepository().getOwnHealthProfile())
    } catch (cause) {
      setError(normalizeApiError(cause))
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Load-on-mount: the loader flips isLoading synchronously before its first
    // await, which the compiler rule flags. Safe here - it is one extra render
    // on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  /**
   * Creates the record on first save and patches it after, so the page has one
   * save button rather than two paths the user has to understand.
   */
  const save = useCallback(
    async (input: { displayName?: string } & ProfileHealthInfo) => {
      const repository = getCareRepository()
      const saved = profile
        ? await repository.updateProfile(profile.id, {
            ...input,
            displayName: input.displayName || profile.displayName,
          })
        : await repository.ensureOwnHealthProfile(input)
      setProfile(saved)
      return saved
    },
    [profile]
  )

  return { profile, isLoading, error, reload: load, save }
}

export function healthProfileErrorMessage(error: ApiError | null) {
  return error && isApiError(error) ? error.message : null
}
