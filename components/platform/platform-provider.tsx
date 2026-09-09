"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { getAppBuild } from "@/lib/infrastructure/config"
import { getPlatformRepository } from "@/lib/composition/platform-repository"
import type {
  BootstrapConfig,
  PlatformFeature,
  PlatformLimits,
} from "@/lib/domain/platform"
import {
  DEFAULT_PLATFORM_FEATURES,
  DEFAULT_PLATFORM_LIMITS,
} from "@/lib/domain/platform"

type PlatformContextValue = {
  bootstrap: BootstrapConfig | null
  isLoading: boolean
  loadError: string | null
  refresh: () => Promise<void>
  isFeatureEnabled: (feature: PlatformFeature) => boolean
  limits: PlatformLimits
  forceUpdate: boolean
  appBuild: number
}

const PlatformContext = createContext<PlatformContextValue | null>(null)

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [bootstrap, setBootstrap] = useState<BootstrapConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const appBuild = getAppBuild()

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const next = await getPlatformRepository().getBootstrap(appBuild)
      setBootstrap(next)
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Gagal memuatkan konfigurasi platform."
      )
    } finally {
      setIsLoading(false)
    }
  }, [appBuild])

  useEffect(() => {
    // Load-on-mount: the loader flips isLoading synchronously before its first
    // await, which the compiler rule flags. Safe here - it is one extra render
    // on mount, and the alternative (deferring the flip) would show a stale
    // "loaded" frame first.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
  }, [refresh])

  const value = useMemo<PlatformContextValue>(
    () => ({
      bootstrap,
      isLoading,
      loadError,
      refresh,
      isFeatureEnabled(feature) {
        return (
          bootstrap?.features[feature] ?? DEFAULT_PLATFORM_FEATURES[feature]
        )
      },
      limits: bootstrap?.limits ?? DEFAULT_PLATFORM_LIMITS,
      forceUpdate: bootstrap?.forceUpdate ?? false,
      appBuild,
    }),
    [appBuild, bootstrap, isLoading, loadError, refresh]
  )

  return (
    <PlatformContext.Provider value={value}>
      {children}
    </PlatformContext.Provider>
  )
}

export function usePlatform() {
  const context = useContext(PlatformContext)
  if (!context) {
    throw new Error("usePlatform must be used within PlatformProvider")
  }
  return context
}
