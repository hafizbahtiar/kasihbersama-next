"use client"

import { useCallback, useEffect, useState } from "react"

import { getTaskRepository } from "@/lib/composition/task-repository"
import type { RecurringTask } from "@/lib/domain/task"
import { ApiError, isApiError } from "@/lib/infrastructure/api/errors"

/** Tugasan berulang satu circle - senarai kecil, dimuat sekaligus. */
export function useRecurringTasks(circleId: string) {
  const [recurring, setRecurring] = useState<RecurringTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setRecurring(await getTaskRepository().listRecurring(circleId))
    } catch (cause) {
      setRecurring([])
      setError(
        isApiError(cause)
          ? cause
          : new ApiError("Gagal memuatkan tugasan berulang.", {
              code: "internal",
              status: 500,
            })
      )
    } finally {
      setIsLoading(false)
    }
  }, [circleId])

  useEffect(() => {
    // Load-on-mount: sama seperti use-person-needs.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  return { recurring, isLoading, error, reload: load }
}
