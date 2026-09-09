import { sessionSync } from "@/lib/infrastructure/api/session-sync"

const ACCESS_KEY = "kb-access-token"
const REFRESH_KEY = "kb-refresh-token"
const SESSION_COOKIE = "kb-refresh-token"

function sessionMaxAgeSeconds() {
  const days = Number.parseInt(
    process.env.NEXT_PUBLIC_SESSION_MAX_AGE_DAYS ?? "30",
    10
  )
  if (!Number.isFinite(days) || days <= 0) {
    return 60 * 60 * 24 * 30
  }
  return Math.floor(days * 24 * 60 * 60)
}

function canUseDom() {
  return typeof window !== "undefined"
}

function setSessionCookie(refreshToken: string) {
  if (!canUseDom()) {
    return
  }
  const secure =
    window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(refreshToken)}; Path=/; SameSite=Lax; Max-Age=${sessionMaxAgeSeconds()}${secure}`
}

function clearSessionCookie() {
  if (!canUseDom()) {
    return
  }
  document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0`
}

export const tokenStorage = {
  readAccess() {
    if (!canUseDom()) {
      return null
    }
    return window.localStorage.getItem(ACCESS_KEY)
  },

  readRefresh() {
    if (!canUseDom()) {
      return null
    }
    return window.localStorage.getItem(REFRESH_KEY)
  },

  saveTokens(accessToken: string, refreshToken: string) {
    if (!canUseDom()) {
      return
    }
    window.localStorage.setItem(ACCESS_KEY, accessToken)
    window.localStorage.setItem(REFRESH_KEY, refreshToken)
    setSessionCookie(refreshToken)
    sessionSync.notifySignedIn()
  },

  clearSessionCookieOnly() {
    clearSessionCookie()
  },

  clear() {
    if (!canUseDom()) {
      return
    }
    window.localStorage.removeItem(ACCESS_KEY)
    window.localStorage.removeItem(REFRESH_KEY)
    clearSessionCookie()
    sessionSync.notifySignedOut()
  },

  hasSession() {
    return Boolean(this.readRefresh())
  },
}
