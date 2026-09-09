/**
 * Base URL for calls made from the server (route handlers, server components,
 * the rewrite in next.config.ts).
 *
 * On Railway, API_INTERNAL_BASE_URL points at the backend's private domain
 * (http://kasihbersama-backend.railway.internal:8080). That traffic never
 * leaves the project, so it is neither billed as egress nor routed through the
 * public edge. It is deliberately NOT a NEXT_PUBLIC_ variable: those are
 * inlined into the browser bundle, and a .railway.internal host is
 * unreachable from a browser anyway.
 *
 * Falls back to the public URL, so local dev and non-Railway hosts need no
 * extra configuration.
 */
export function getServerApiBaseUrl() {
  return (
    process.env.API_INTERNAL_BASE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:8080"
  )
}

export function getApiBaseUrl() {
  // Browser calls same-origin /api/v1/*; Next.js rewrites to the backend (avoids CORS).
  if (typeof window !== "undefined") {
    return ""
  }
  return getServerApiBaseUrl()
}

export function isMockDataEnabled() {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true") {
    return true
  }
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false") {
    return false
  }
  return !process.env.NEXT_PUBLIC_API_BASE_URL
}

export function getAppBuild() {
  const raw = process.env.NEXT_PUBLIC_APP_BUILD
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

export function getAppPlatform() {
  return process.env.NEXT_PUBLIC_APP_PLATFORM ?? "web"
}

export function getApiVersion() {
  return process.env.NEXT_PUBLIC_API_VERSION ?? "v1"
}
