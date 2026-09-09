import type { ApiErrorBody } from "@/lib/infrastructure/api/types"

export class ApiError extends Error {
  readonly code: string
  readonly status: number
  readonly requestId?: string
  readonly details?: Record<string, unknown>

  constructor(
    message: string,
    options: {
      code: string
      status: number
      requestId?: string
      details?: Record<string, unknown>
    }
  ) {
    super(message)
    this.name = "ApiError"
    this.code = options.code
    this.status = options.status
    this.requestId = options.requestId
    this.details = options.details
  }
}

/** Maps backend `error.code` to default Malay copy for toasts/banners. */
const CODE_MESSAGES: Record<string, string> = {
  unauthenticated: "Sila log masuk semula.",
  not_permitted: "Anda tidak dibenarkan melakukan tindakan ini.",
  forbidden: "Anda tidak dibenarkan melakukan tindakan ini.",
  not_found: "Rekod tidak dijumpai.",
  conflict: "Rekod sudah wujud atau bercanggah.",
  // The backend has returned this since the free tier shipped and nothing
  // mapped it, so hitting the profile cap read as "Rekod bercanggah." - a
  // message that names neither the cause nor the fix.
  quota_exceeded:
    "Anda sudah mencapai had pelan anda. Lihat Penggunaan untuk butiran.",
  deletion_blocked:
    "Selesaikan profil jagaan di bawah sebelum memadam akaun anda.",
  pending_invites:
    "Ada jemputan yang belum dijawab ke e-mel semasa. Terima atau batalkan jemputan itu dahulu.",
  email_taken: "E-mel ini sudah didaftarkan pada akaun lain.",
  already_claimed: "Profil sudah dituntut.",
  unprocessable: "Maklumat tidak sah. Semak semula borang.",
  invalid_argument: "Parameter permintaan tidak sah.",
  locked: "Akaun dikunci sementara. Cuba lagi kemudian.",
  rate_limited: "Terlalu banyak percubaan. Cuba lagi kemudian.",
  expired: "Pautan atau token sudah tamat tempoh.",
  gone: "Pautan atau token sudah tamat tempoh.",
  internal: "Ralat pelayan. Cuba lagi.",
  storage_error: "Ralat storan fail. Cuba lagi.",
  network: "Tidak dapat hubungi pelayan. Semak sambungan rangkaian.",
}

/** HTTP status fallbacks when `error.code` is unknown. */
const STATUS_MESSAGES: Record<number, string> = {
  400: "Permintaan tidak sah.",
  401: "Sila log masuk semula.",
  403: "Anda tidak dibenarkan.",
  404: "Rekod tidak dijumpai.",
  409: "Rekod bercanggah.",
  410: "Pautan sudah tamat tempoh.",
  422: "Maklumat tidak sah.",
  429: "Terlalu banyak percubaan.",
}

export function messageForApiError(error: ApiError) {
  return (
    CODE_MESSAGES[error.code] ?? STATUS_MESSAGES[error.status] ?? error.message
  )
}

export type FieldErrors = Record<string, string>

/**
 * Extract field-level errors when backend populates `error.details`.
 * Today most handlers return an empty `details` object and put validation
 * text in `error.message`; callers should fall back to that message.
 */
export function fieldErrorsFromApiError(error: ApiError): FieldErrors {
  const details = error.details
  if (!details) {
    return {}
  }

  const nested =
    details.fields && typeof details.fields === "object"
      ? (details.fields as Record<string, unknown>)
      : details

  const result: FieldErrors = {}
  for (const [key, value] of Object.entries(nested)) {
    if (key === "fields") {
      continue
    }
    if (typeof value === "string" && value.trim()) {
      result[key] = value
    }
  }
  return result
}

export async function parseApiError(response: Response) {
  let body: ApiErrorBody | undefined
  try {
    body = (await response.json()) as ApiErrorBody
  } catch {
    body = undefined
  }

  const code = body?.error.code?.toLowerCase() ?? "internal"
  const message =
    body?.error.message ?? response.statusText ?? "Permintaan gagal."

  return new ApiError(message, {
    code,
    status: response.status,
    requestId: body?.error.request_id,
    details: body?.error.details,
  })
}

/**
 * The care profiles standing in the way of an account deletion.
 *
 * The backend puts them in `error.details.profiles` rather than in the
 * message, because the user's next action differs per `reason` and prose
 * cannot be branched on. Returns an empty array for any other error.
 */
export function deletionBlockersFromError(error: unknown) {
  if (!isApiError(error) || error.code !== "deletion_blocked") {
    return []
  }
  const raw = error.details?.profiles
  if (!Array.isArray(raw)) {
    return []
  }
  return raw.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return []
    }
    const item = entry as Record<string, unknown>
    const reason = item.reason
    if (reason !== "sole_admin" && reason !== "shared_subject") {
      return []
    }
    return [
      {
        id: String(item.id ?? ""),
        displayName: String(item.display_name ?? ""),
        reason: reason as "sole_admin" | "shared_subject",
      },
    ]
  })
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError
}

export function normalizeApiError(cause: unknown): ApiError {
  if (isApiError(cause)) {
    return cause
  }
  if (cause instanceof TypeError) {
    return new ApiError("Tidak dapat hubungi pelayan.", {
      code: "network",
      status: 0,
    })
  }
  return new ApiError("Permintaan gagal.", {
    code: "internal",
    status: 500,
  })
}
