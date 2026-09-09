export type ApiErrorBody = {
  error: {
    code: string
    message: string
    request_id?: string
    details?: Record<string, unknown>
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

export type TokenPairResponse = {
  access_token: string
  refresh_token: string
}

export type MeResponse = {
  id: string
  email: string
  display_name: string
  email_verified: boolean
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

export type ApiDeleteAccountResponse = {
  anonymized_at: string
  deleted_care_profile_ids?: string[]
}
