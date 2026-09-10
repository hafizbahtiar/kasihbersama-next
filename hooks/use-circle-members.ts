"use client"

import { useCallback, useEffect, useState } from "react"

import { getCareRepository } from "@/lib/composition/care-repository"
import type { CircleMember, CircleMemberRole } from "@/lib/domain/care"
import { ApiError, isApiError } from "@/lib/infrastructure/api/errors"

type AsyncState = {
  members: CircleMember[]
  isLoading: boolean
  error: ApiError | null
}

function toApiError(cause: unknown, fallback: string): ApiError {
  return isApiError(cause)
    ? cause
    : new ApiError(fallback, { code: "internal", status: 500 })
}

/**
 * Circle membership for one circle.
 *
 * Its own hook rather than a slice of the global care snapshot: members are
 * per-circle and only the detail page wants them, so putting them in the
 * snapshot would make every page pay for a list one page reads.
 *
 * Add and remove return the server's full member list, so they replace state
 * outright instead of reconciling. That matters here more than it looks:
 * adding by email resolves to a user the caller cannot predict, re-adding
 * someone changes their role rather than duplicating them, and removing the
 * last owner is refused - so the returned list is the only trustworthy
 * account of who is in the circle.
 */
export function useCircleMembers(circleId: string | undefined) {
  const [state, setState] = useState<AsyncState>({
    members: [],
    isLoading: false,
    error: null,
  })

  const load = useCallback(async () => {
    if (!circleId) {
      return
    }
    setState((current) => ({ ...current, isLoading: true, error: null }))
    try {
      const members = await getCareRepository().listCircleMembers(circleId)
      setState({ members, isLoading: false, error: null })
    } catch (cause) {
      setState({
        members: [],
        isLoading: false,
        error: toApiError(cause, "Gagal memuatkan ahli kumpulan."),
      })
    }
  }, [circleId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const add = useCallback(
    async (email: string, role: CircleMemberRole) => {
      if (!circleId) {
        return
      }
      const members = await getCareRepository().addCircleMember(
        circleId,
        email,
        role
      )
      setState({ members, isLoading: false, error: null })
    },
    [circleId]
  )

  const remove = useCallback(
    async (userId: string) => {
      if (!circleId) {
        return
      }
      const members = await getCareRepository().removeCircleMember(
        circleId,
        userId
      )
      setState({ members, isLoading: false, error: null })
    },
    [circleId]
  )

  return { ...state, reload: load, add, remove }
}
