"use client"

import { useCallback, useEffect, useState } from "react"

import { getGrowthRepository } from "@/lib/composition/growth-repository"
import type { GrowthChart, GrowthIndicator } from "@/lib/domain/growth"
import {
  ApiError,
  isApiError,
  isGrowthChartNotReady,
  type GrowthChartNotReadyError,
} from "@/lib/infrastructure/api/errors"

type State = {
  chart: GrowthChart | null
  notReady: GrowthChartNotReadyError | null
  isLoading: boolean
  error: ApiError | null
}

/**
 * One growth chart.
 *
 * "Not ready" is kept apart from "error" on purpose. A profile with no date of
 * birth is not a failure - it is a chart that cannot exist yet, and the screen
 * for it says which field to add rather than offering a retry that will fail
 * the same way.
 */
export function useGrowthChart(
  profileId: string | undefined,
  indicator: GrowthIndicator
) {
  const [state, setState] = useState<State>({
    chart: null,
    notReady: null,
    isLoading: false,
    error: null,
  })

  const load = useCallback(async () => {
    if (!profileId) {
      return
    }
    setState((current) => ({
      ...current,
      isLoading: true,
      error: null,
      notReady: null,
    }))
    try {
      const chart = await getGrowthRepository().getGrowthChart(
        profileId,
        indicator
      )
      setState({ chart, notReady: null, isLoading: false, error: null })
    } catch (cause) {
      if (isGrowthChartNotReady(cause)) {
        setState({
          chart: null,
          notReady: cause,
          isLoading: false,
          error: null,
        })
        return
      }
      setState({
        chart: null,
        notReady: null,
        isLoading: false,
        error: isApiError(cause)
          ? cause
          : new ApiError("Gagal memuatkan carta tumbesaran.", {
              code: "internal",
              status: 500,
            }),
      })
    }
  }, [profileId, indicator])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  return { ...state, reload: load }
}
