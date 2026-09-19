/**
 * One entry in `error.details`. The backend sends an array (docs/00 §6.1 of the
 * backend repo), and `field` is huma's location string - `body.email`,
 * `query.per_page` - so consumers strip the prefix to key a form field.
 */
export type ApiErrorDetail = {
  field?: string
  issue?: string
}

export type ApiErrorBody = {
  error: {
    code: string
    message: string
    request_id?: string
    details?: ApiErrorDetail[]
  }
}

/**
 * Paginated list envelope from backend (`internal/transport/http/v1/pagination.go`).
 *
 * Query: `page` (default 1), `per_page` (default 20, max 100).
 * Mapped to domain `PaginatedResult` via `mapPaginated()` (camelCase fields).
 */
export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
  has_more: boolean
}

/**
 * The backend's token envelope (`tokenDTO` in the auth transport). The nested
 * `tokens` key is how `/v1/auth/refresh` and `/v1/auth/mfa/verify` answer -
 * unwrapped on the way through `ApiAuthRepository`, never past it.
 */
export type ApiTokenDTO = {
  access_token: string
  access_expires_at: string
  refresh_token: string
  refresh_expires_at: string
  token_type: string
}

export type TokenPairResponse = {
  tokens: ApiTokenDTO
}

export type ApiUserDTO = {
  id: string
  email: string
  display_name: string
  given_name?: string
  family_name?: string
  status: string
  locale: string
  timezone: string
  email_verified: boolean
}

/**
 * `POST /v1/auth/login` answers with either a session or a second factor -
 * never both. `mfa_required` is a 200, not an error: the credentials were
 * correct and the next step is a code.
 */
export type LoginResponse = {
  user?: ApiUserDTO
  tokens?: ApiTokenDTO
  mfa_required?: boolean
  challenge_token?: string
}

/** `POST /v1/auth/register` (201) creates the account but no session. */
export type RegisterResponse = {
  user: ApiUserDTO
}

/** `GET /v1/auth/me` carries the session alongside the user. */
export type MeResponse = {
  user: ApiUserDTO
  session: {
    id: string
    mfa_level: number
    absolute_expires_at: string
  }
}

/** `POST /v1/auth/mfa/totp/enroll` - the pending factor's secret and its
 * otpauth URL (`otpauth_url` in the backend's DTO). */
export type MfaEnrollResponse = {
  secret: string
  otpauth_url: string
}

/** `POST /v1/auth/mfa/totp/confirm` - the recovery codes, shown once. */
export type MfaConfirmResponse = {
  recovery_codes: string[]
}

export type AcceptMembershipResponse = {
  care_profile_id: string
  role?: string
}

export type UploadIntentResponse = {
  intent_id: string
  object_key: string
  bucket: string
  max_size_bytes: number
  expires_at: string
  upload_url: string
}

export type DocumentDownloadResponse = {
  url: string
  filename: string
  content_type: string
  size_bytes: number
  expires_at: string
  content_disposition: string
}
