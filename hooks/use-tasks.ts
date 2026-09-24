"use client"

import { useCallback, useEffect, useState } from "react"

import { getTaskRepository } from "@/lib/composition/task-repository"
import type { Task } from "@/lib/domain/task"
import { ApiError, isApiError } from "@/lib/infrastructure/api/errors"

/** Tugasan satu circle. Setiap tulisan memuat semula - susunan milik pelayan. */
export function useTasks(circleId: string, includeCancelled: boolean) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setTasks(
        await getTaskRepository().listTasks(circleId, { includeCancelled })
      )
    } catch (cause) {
      setTasks([])
      setError(
        isApiError(cause)
          ? cause
          : new ApiError("Gagal memuatkan tugasan.", {
              code: "internal",
              status: 500,
            })
      )
    } finally {
      setIsLoading(false)
    }
  }, [circleId, includeCancelled])

  useEffect(() => {
    // Load-on-mount: sama seperti use-person-needs.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  return { tasks, isLoading, error, reload: load }
}
