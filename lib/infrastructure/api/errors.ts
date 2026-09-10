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
  // Deliberately distinct from quota_exceeded, matching the backend. The
  // server splits these two precisely because the next action differs -
  // finish or wait out the uploads you started, versus free up space - and
  // falling through to the 409 fallback ("Rekod bercanggah.") threw that
  // distinction away at the last step.
  too_many_pending_uploads:
    "Terlalu banyak muat naik belum selesai. Tunggu ia siap atau cuba lagi sebentar.",
  // The most common validation code. Without an entry it fell through to the
  // 400 fallback, which says the request was invalid without saying what.
  // Handlers put the specific reason in error.message, so this defers to it.
  invalid_request: "",
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
  // An empty entry means "the server's own message is better than anything
  // generic here" - invalid_request carries the specific field or reason.
  const byCode = CODE_MESSAGES[error.code]
  if (byCode) {
    return byCode
  }
  if (byCode === "" && error.message) {
    return error.message
  }
  return STATUS_MESSAGES[error.status] ?? error.message
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

/**
 * The growth chart's 409: preconditions unmet, carrying which ones.
 *
 * A distinct type rather than a bare ApiError because the caller acts on the
 * list - it tells the parent to add a date of birth or a gender, which is a
 * different screen from "something went wrong". The endpoint answers 409
 * rather than 200 with a flag because it was told to draw a chart and cannot;
 * GET /growth/readiness answers 200 with ready:false because being asked
 * whether a chart can be drawn makes "no" a successful answer.
 */
export class GrowthChartNotReadyError extends ApiError {
  readonly missing: string[]

  constructor(message: string, missing: string[]) {
    super(message, { code: "not_ready", status: 409 })
    this.name = "GrowthChartNotReadyError"
    this.missing = missing
  }
}

export function isGrowthChartNotReady(
  error: unknown
): error is GrowthChartNotReadyError {
  return error instanceof GrowthChartNotReadyError
}
