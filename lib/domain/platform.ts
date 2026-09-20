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
  /**
   * How many circles the account may OWN. Circles joined by invitation never count
   * against it (docs/09 §2), which is why the client compares it to the circles whose
   * `ownerUserId` is its own.
   */
  maxOwnedCircles: number
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
 * Used until bootstrap answers, and if it never does. They are the free plan's own
 * numbers (docs/09 §1), so a page that renders before the call lands shows the same
 * ceilings it will settle on.
 */
export const DEFAULT_PLATFORM_LIMITS: PlatformLimits = {
  maxImageMb: 5,
  maxPdfMb: 10,
  maxCircleStorageMb: 250,
  maxOwnedCircles: 1,
}
