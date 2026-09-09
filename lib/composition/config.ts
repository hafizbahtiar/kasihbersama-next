export function getApiBaseUrl() {
  // Browser calls same-origin /api/v1/*; Next.js rewrites to the backend (avoids CORS).
  if (typeof window !== "undefined") {
    return ""
  }
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
    "http://localhost:8080"
  )
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
