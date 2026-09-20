"use client"

import { useCallback, useEffect, useState } from "react"

import { getCircleRepository } from "@/lib/composition/circle-repository"
import type { CircleInvitation, CircleMembership } from "@/lib/domain/circle"
import { isApiError, type ApiError } from "@/lib/infrastructure/api/errors"

/** One pending invitation, with the circle it belongs to - the tab spans circles. */
export type PendingInvitation = CircleInvitation & {
  circleId: string
  circleName: string
}

/**
 * Every pending invitation the caller may revoke, across their circles.
 *
 * Permissions are resolved for the ACTIVE circle only (bootstrap), so this cannot ask
 * "which circles allow reading invitations?" before asking. It asks each circle and
 * drops the refusals - 403 here means "not yours to see", which is not an error the
 * reader can act on.
 */
export function usePendingInvitations(circles: CircleMembership[]) {
  const [data, setData] = useState<PendingInvitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  // `circles` comes from the platform provider, which only rebuilds it when bootstrap is
  // re-read - so it is a stable dependency and this does not refetch on every render.
  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const repo = getCircleRepository()
    const settled = await Promise.allSettled(
      circles.map(async (circle) => {
        const rows = await repo.listInvitations(circle.id)
        return rows.map(
          (row): PendingInvitation => ({
            ...row,
            circleId: circle.id,
            circleName: circle.name,
          })
        )
      })
    )

    const merged: PendingInvitation[] = []
    let firstError: ApiError | null = null
    for (const result of settled) {
      if (result.status === "fulfilled") {
        merged.push(...result.value)
        continue
      }
      // A refusal is not a failure to report: it only means this circle's invitations
      // are not visible here.
      if (isApiError(result.reason) && result.reason.status === 403) {
        continue
      }
      firstError ??= isApiError(result.reason) ? result.reason : null
    }

    setData(
      merged.sort((a, b) => a.circleName.localeCompare(b.circleName))
    )
    setError(firstError)
    setIsLoading(false)
  }, [circles])

  useEffect(() => {
    // Load-on-mount: the loader flips isLoading synchronously before its first await,
    // which the compiler rule flags. Safe here - one extra render on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  return { data, isLoading, error, reload: load }
}
