/** Web routes for membership token acceptance (authenticated in-app flow). */
export const INVITE_ACCEPT_APP_PATH = "/invites/accept"
export const CLAIM_ACCEPT_APP_PATH = "/claims/accept"

/**
 * Public landing routes. Email links should target these with a URL fragment
 * (`#token=…`) so the secret is not sent to the server or logged in Referer.
 * See kasihbersama-backend/docs/04-claim-invite-transfer.md.
 */
export const INVITE_ACCEPT_LANDING_PATH = "/accept/invite"
export const CLAIM_ACCEPT_LANDING_PATH = "/accept/claim"

const STORAGE_KEYS = {
  invite: "kb-pending-invite-token",
  claim: "kb-pending-claim-token",
} as const

export type TokenAcceptKind = "invite" | "claim"

export function buildInviteAcceptLink(token: string) {
  return `${INVITE_ACCEPT_LANDING_PATH}#token=${encodeURIComponent(token)}`
}

export function buildClaimAcceptLink(token: string) {
  return `${CLAIM_ACCEPT_LANDING_PATH}#token=${encodeURIComponent(token)}`
}

export function appPathForTokenKind(kind: TokenAcceptKind) {
  return kind === "invite" ? INVITE_ACCEPT_APP_PATH : CLAIM_ACCEPT_APP_PATH
}

export function landingPathForTokenKind(kind: TokenAcceptKind) {
  return kind === "invite"
    ? INVITE_ACCEPT_LANDING_PATH
    : CLAIM_ACCEPT_LANDING_PATH
}

export function storageKeyForTokenKind(kind: TokenAcceptKind) {
  return STORAGE_KEYS[kind]
}

/** Read token from `#token=` fragment (preferred) or legacy `?token=` query. */
export function readTokenFromUrl(
  searchParams?: Pick<URLSearchParams, "get">
) {
  if (typeof window === "undefined") {
    return searchParams?.get("token") ?? ""
  }

  const hash = window.location.hash
  if (hash.startsWith("#token=")) {
    return decodeURIComponent(hash.slice("#token=".length))
  }

  if (searchParams) {
    return searchParams.get("token") ?? ""
  }

  return new URLSearchParams(window.location.search).get("token") ?? ""
}

/** Persist token across login redirect, then strip it from the visible URL. */
export function captureTokenFromUrl(kind: TokenAcceptKind) {
  if (typeof window === "undefined") {
    return ""
  }

  const token = readTokenFromUrl()
  if (!token) {
    return sessionStorage.getItem(storageKeyForTokenKind(kind)) ?? ""
  }

  sessionStorage.setItem(storageKeyForTokenKind(kind), token)

  const clean = new URL(window.location.href)
  clean.hash = ""
  clean.searchParams.delete("token")
  window.history.replaceState({}, "", clean.pathname + clean.search)

  return token
}

export function consumeStoredToken(kind: TokenAcceptKind) {
  const key = storageKeyForTokenKind(kind)
  const token = sessionStorage.getItem(key) ?? ""
  if (token) {
    sessionStorage.removeItem(key)
  }
  return token
}

export function peekStoredToken(kind: TokenAcceptKind) {
  return sessionStorage.getItem(storageKeyForTokenKind(kind)) ?? ""
}
