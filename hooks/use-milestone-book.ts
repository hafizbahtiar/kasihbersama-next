"use client"

import { useCallback, useEffect, useState } from "react"

import { getGrowthRepository } from "@/lib/composition/growth-repository"
import type { MilestoneBook, RecordMilestoneInput } from "@/lib/domain/growth"
import { ApiError, isApiError } from "@/lib/infrastructure/api/errors"

type State = {
  book: MilestoneBook | null
  isLoading: boolean
  error: ApiError | null
}

export function useMilestoneBook(profileId: string | undefined) {
  const [state, setState] = useState<State>({
    book: null,
    isLoading: false,
    error: null,
  })

  const load = useCallback(async () => {
    if (!profileId) {
      return
    }
    setState((current) => ({ ...current, isLoading: true, error: null }))
    try {
      const book = await getGrowthRepository().getMilestoneBook(profileId)
      setState({ book, isLoading: false, error: null })
    } catch (cause) {
      setState({
        book: null,
        isLoading: false,
        error: isApiError(cause)
          ? cause
          : new ApiError("Gagal memuatkan senarai semak perkembangan.", {
              code: "internal",
              status: 500,
            }),
      })
    }
  }, [profileId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const mark = useCallback(
    async (input: RecordMilestoneInput) => {
      if (!profileId) {
        return
      }
      await getGrowthRepository().recordMilestone(profileId, input)
      await load()
    },
    [profileId, load]
  )

  const unmark = useCallback(
    async (milestoneId: string) => {
      if (!profileId) {
        return
      }
      await getGrowthRepository().deleteMilestone(profileId, milestoneId)
      await load()
    },
    [profileId, load]
  )

  return { ...state, reload: load, mark, unmark }
}
