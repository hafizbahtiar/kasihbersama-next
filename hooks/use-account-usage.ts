"use client"

import { useCallback, useEffect, useState } from "react"

import { getAccountRepository } from "@/lib/composition/account-repository"
import type { AccountUsage } from "@/lib/domain/account"

/**
 * Live usage from GET /me/usage — the counts the enforcers use, not a
 * client-side guess from whatever list happens to be loaded.
 */
export function useAccountUsage() {
  const [usage, setUsage] = useState<AccountUsage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const next = await getAccountRepository().getUsage()
      setUsage(next)
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Gagal memuatkan penggunaan akaun."
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
  }, [refresh])

  return { usage, isLoading, loadError, refresh }
}
