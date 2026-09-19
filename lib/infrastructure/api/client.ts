import { parseApiError, ApiError } from "@/lib/infrastructure/api/errors"
import { applyDefaultApiHeaders } from "@/lib/infrastructure/api/request-headers"
import { tokenStorage } from "@/lib/infrastructure/api/token-storage"

const PRE_AUTH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/password/forgot",
  "/auth/password/reset",
  "/auth/verify-email",
  "/auth/verification/resend",
  "/auth/mfa/verify",
]

export type ApiRequestInit = RequestInit & {
  skipAuth?: boolean
  skipRefresh?: boolean
  /**
   * Sent as `Idempotency-Key` and makes the request retryable (doc 06
   * §Idempotency). Generate one per user action and pass the same value for
   * the whole action - the retries below reuse it, which is what lets the
   * server replay the first answer instead of applying the write twice.
   */
  idempotencyKey?: string
}

/**
 * Waits before each retry of a keyed request. Three retries, about 3.5 s in
 * total: long enough to ride out a dropped connection or a redeploy, short
 * enough that a user watching a spinner is not left wondering.
 */
const IDEMPOTENT_RETRY_DELAYS_MS = [500, 1000, 2000]

/**
 * Statuses worth retrying with the same key. A gateway error or a 503 says
 * nothing about whether the write happened - which is exactly the question
 * the key answers. The backend releases the key on a 5xx it produced, so a
 * retry runs the work again rather than replaying the failure.
 */
const RETRYABLE_STATUSES = new Set([502, 503, 504])

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

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

  /**
   * The raw response body, for endpoints whose artefact *is* the text - the
   * account export, which the user saves to a file. Parsing and re-serialising
   * it would only risk changing what they receive.
   */
  async requestText(path: string, init: ApiRequestInit = {}): Promise<string> {
    const response = await this.fetch(path, init)
    if (!response.ok) {
      throw await parseApiError(response)
    }
    return response.text()
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

  /**
   * Retries only requests that carry an idempotency key. Without one, a
   * retry after a lost response could apply the write twice; with one, the
   * server either runs it once or replays what it already answered.
   */
  private async fetch(path: string, init: ApiRequestInit = {}) {
    if (!init.idempotencyKey) {
      return this.fetchOnce(path, init)
    }
    for (let attempt = 0; ; attempt++) {
      const canRetry =
        attempt < IDEMPOTENT_RETRY_DELAYS_MS.length && !init.signal?.aborted
      let response: Response
      try {
        response = await this.fetchOnce(path, init)
      } catch (cause) {
        // A network failure is the case the key exists for: the request may
        // have reached the server and only the answer was lost.
        if (!canRetry || (cause as Error)?.name === "AbortError") {
          throw cause
        }
        await sleep(IDEMPOTENT_RETRY_DELAYS_MS[attempt])
        continue
      }
      if (!canRetry || !(await isRetryable(response))) {
        return response
      }
      await sleep(IDEMPOTENT_RETRY_DELAYS_MS[attempt])
    }
  }

  private async fetchOnce(path: string, init: ApiRequestInit = {}) {
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
        tokens?: { access_token?: unknown; refresh_token?: unknown }
      }
      const tokens = data.tokens
      if (
        typeof tokens?.access_token !== "string" ||
        typeof tokens?.refresh_token !== "string" ||
        !tokens.access_token ||
        !tokens.refresh_token
      ) {
        return false
      }
      tokenStorage.saveTokens(tokens.access_token, tokens.refresh_token)
      return true
    } catch {
      return false
    }
  }
}

async function isRetryable(response: Response) {
  if (RETRYABLE_STATUSES.has(response.status)) {
    return true
  }
  if (response.status !== 409) {
    return false
  }
  // The first attempt with this key is still running on the server - usually
  // the one whose response was lost. Waiting lets it finish so the next try
  // gets its replay. Read from a clone: a 409 that is not this one is
  // returned to the caller, whose error parsing needs the body intact.
  try {
    const body = (await response.clone().json()) as {
      error?: { code?: string }
    }
    return body.error?.code === "idempotency_in_progress"
  } catch {
    return false
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
