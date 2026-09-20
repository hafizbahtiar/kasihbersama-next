/**
 * What the client must know before the first screen renders - one call,
 * `GET /v1/bootstrap` (docs/00 §6.8).
 *
 * The `platform` block always comes back, with or without a token: the version
 * gate has to reach the user on an old build who can no longer sign in. The
 * `account` block only appears when a valid token was sent, and an expired one
 * is not an error - it means "not signed in".
 */
import type { AuthUser } from "@/lib/domain/auth"
import type { CircleMembership } from "@/lib/domain/circle"

export type PlatformLimits = {
  maxImageMb: number
  maxPdfMb: number
  maxCircleStorageMb: number
}

export type PlatformInfo = {
  apiVersion: string
  serverTime: string
  minSupportedBuild: number
  latestBuild: number
  forceUpdate: boolean
  limits: PlatformLimits
}

export type BootstrapAccount = {
  user: AuthUser
  /**
   * The session's active circle, or null when the account has joined none - or
   * has more than one and has not chosen. Null is a valid state: render
   * onboarding or a picker, never an empty screen.
   */
  activeCircleId: string | null
  circles: CircleMembership[]
  /**
   * Effective permission keys for the ACTIVE circle. They exist to hide the
   * impossible, never to replace the server's checks - every route still
   * enforces its own, and a UI that hides too little only earns a 403.
   */
  permissions: string[]
  unreadNotifications: number
}

export type Bootstrap = {
  platform: PlatformInfo
  account?: BootstrapAccount
}

/**
 * Used until bootstrap answers, and if it never does. They are the storage
 * ceilings from the backend's own constants, so a page that renders before the
 * call lands shows the same numbers it will settle on.
 */
export const DEFAULT_PLATFORM_LIMITS: PlatformLimits = {
  maxImageMb: 5,
  maxPdfMb: 10,
  maxCircleStorageMb: 2048,
}
