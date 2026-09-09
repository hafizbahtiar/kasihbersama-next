import { parseApiError, ApiError } from "@/lib/infrastructure/api/errors"
import { applyDefaultApiHeaders } from "@/lib/infrastructure/api/request-headers"
import { tokenStorage } from "@/lib/infrastructure/api/token-storage"

const PRE_AUTH_PATHS = [
  "/auth/login",
  "/auth/signup",
  "/auth/refresh",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
]

export type ApiRequestInit = RequestInit & {
  skipAuth?: boolean
  skipRefresh?: boolean
  idempotencyKey?: string
}

export class ApiClient {
  private refreshing: Promise<boolean> | null = null
  onAuthFailure?: () => void

  constructor(private readonly baseUrl: string) {}

  private get apiBase() {
    return `${this.baseUrl.replace(/\/$/, "")}/api/v1`
  }

  async request<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
    const response = await this.fetch(path, init)
    if (response.status === 204 || response.status === 205) {
      return undefined as T
    }
    if (!response.ok) {
      throw await parseApiError(response)
    }
    const body = await response.text()
    if (!body.trim()) {
      return undefined as T
    }
    try {
      return JSON.parse(body) as T
    } catch {
      throw new ApiError("Respons pelayan tidak sah.", {
        code: "internal",
        status: response.status,
      })
    }
  }

  private buildHeaders(init: ApiRequestInit) {
    const headers = new Headers(init.headers)
    applyDefaultApiHeaders(headers)
    if (!headers.has("Content-Type") && init.body) {
      headers.set("Content-Type", "application/json")
    }
    if (init.idempotencyKey) {
      headers.set("Idempotency-Key", init.idempotencyKey)
    }
    if (!init.skipAuth) {
      const access = tokenStorage.readAccess()
      if (access) {
        headers.set("Authorization", `Bearer ${access}`)
      }
    }
    return headers
  }

  private async fetch(path: string, init: ApiRequestInit = {}) {
    const response = await fetch(`${this.apiBase}${path}`, {
      ...init,
      headers: this.buildHeaders(init),
    })

    if (
      response.status === 401 &&
      !init.skipAuth &&
      !init.skipRefresh &&
      !PRE_AUTH_PATHS.some((item) => path.includes(item))
    ) {
      const refreshed = await this.tryRefresh()
      if (!refreshed) {
        tokenStorage.clear()
        this.onAuthFailure?.()
        return response
      }
      return fetch(`${this.apiBase}${path}`, {
        ...init,
        headers: this.buildHeaders(init),
      })
    }

    return response
  }

  private tryRefresh() {
    return (this.refreshing ??= this.performRefresh().finally(() => {
      this.refreshing = null
    }))
  }

  private async performRefresh() {
    const refresh = tokenStorage.readRefresh()
    if (!refresh) {
      return false
    }
    try {
      const headers = new Headers({ "Content-Type": "application/json" })
      applyDefaultApiHeaders(headers)
      const response = await fetch(`${this.apiBase}/auth/refresh`, {
        method: "POST",
        headers,
        body: JSON.stringify({ refresh_token: refresh }),
      })
      if (!response.ok) {
        return false
      }
      const data = (await response.json()) as {
        access_token?: unknown
        refresh_token?: unknown
      }
      if (
        typeof data.access_token !== "string" ||
        typeof data.refresh_token !== "string" ||
        !data.access_token ||
        !data.refresh_token
      ) {
        return false
      }
      tokenStorage.saveTokens(data.access_token, data.refresh_token)
      return true
    } catch {
      return false
    }
  }
}

let client: ApiClient | undefined

export function createApiClient(baseUrl: string) {
  return new ApiClient(baseUrl)
}

export function getApiClient(baseUrl: string) {
  client ??= createApiClient(baseUrl)
  return client
}

export function resetApiClient() {
  client = undefined
}

export { ApiError }
