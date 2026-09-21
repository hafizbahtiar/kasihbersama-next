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

import { getPlatformRepository } from "@/lib/composition/platform-repository"
import { getCircleRepository } from "@/lib/composition/circle-repository"
import type { CircleMembership } from "@/lib/domain/circle"
import type { Bootstrap, PlatformLimits } from "@/lib/domain/platform"
import { DEFAULT_PLATFORM_LIMITS } from "@/lib/domain/platform"
import { getAppBuild } from "@/lib/infrastructure/config"

type BootstrapContextValue = {
  bootstrap: Bootstrap | null
  isLoading: boolean
  loadError: string | null
  refresh: () => Promise<void>
  limits: PlatformLimits
  forceUpdate: boolean
  appBuild: number
  /** Circles the account belongs to. Empty is a real state: render onboarding. */
  circles: CircleMembership[]
  /**
   * Circles this account OWNS. Joining other people's circles is unlimited; only
   * owning is capped (free plan: one), so this is the number the cap applies to.
   */
  ownedCircles: CircleMembership[]
  /** False when the owned-circle limit is reached - hide "create", do not fail on submit. */
  canCreateCircle: boolean
  activeCircle: CircleMembership | null
  /**
   * True when the active circle grants this permission key. It hides the
   * impossible; the server still enforces every route.
   */
  can: (permission: string) => boolean
  /** Every key `can` answers true for - what a custom role may be given (docs/02 §5.2 fence 3). */
  permissions: string[]
  unreadNotifications: number
  /** Switches the session's circle, then re-reads bootstrap - permissions change with it. */
  switchCircle: (circleId: string) => Promise<void>
}

const BootstrapContext = createContext<BootstrapContextValue | null>(null)

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const appBuild = getAppBuild()

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      setBootstrap(await getPlatformRepository().getBootstrap(appBuild))
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

  const switchCircle = useCallback(
    async (circleId: string) => {
      await getCircleRepository().switchCircle(circleId)
      // Bootstrap is re-read rather than patched locally: the permission set
      // belongs to the new circle, and the server is the only one that knows it.
      await refresh()
    },
    [refresh]
  )

  const value = useMemo<BootstrapContextValue>(() => {
    const account = bootstrap?.account
    const circles = account?.circles ?? []
    const permissions = new Set(account?.permissions ?? [])
    const ownedCircles = circles.filter(
      (circle) => circle.ownerUserId === account?.user.id
    )
    return {
      bootstrap,
      isLoading,
      loadError,
      refresh,
      limits: bootstrap?.platform.limits ?? DEFAULT_PLATFORM_LIMITS,
      forceUpdate: bootstrap?.platform.forceUpdate ?? false,
      appBuild,
      circles,
      ownedCircles,
      canCreateCircle:
        ownedCircles.length <
        (bootstrap?.platform.limits.maxOwnedCircles ??
          DEFAULT_PLATFORM_LIMITS.maxOwnedCircles),
      activeCircle:
        circles.find((c) => c.id === account?.activeCircleId) ?? null,
      can: (permission) => permissions.has(permission),
      permissions: [...permissions],
      unreadNotifications: account?.unreadNotifications ?? 0,
      switchCircle,
    }
  }, [appBuild, bootstrap, isLoading, loadError, refresh, switchCircle])

  return (
    <BootstrapContext.Provider value={value}>
      {children}
    </BootstrapContext.Provider>
  )
}

export function usePlatform() {
  const context = useContext(BootstrapContext)
  if (!context) {
    throw new Error("usePlatform must be used within PlatformProvider")
  }
  return context
}
