# Frontend API contract notes

This document mirrors [`kasihbersama-backend/docs/06-api-contract.md`](../../kasihbersama-backend/docs/06-api-contract.md) for the Next.js client. Implementation lives under `lib/infrastructure/api/`.

## Error envelope

Backend JSON (all non-2xx):

```json
{
  "error": {
    "code": "unprocessable",
    "message": "display_name must be at most 100 runes",
    "request_id": "req_…",
    "details": {}
  }
}
```

### Client mapping

| Layer | File | Behaviour |
|-------|------|-----------|
| Parse | `lib/infrastructure/api/errors.ts` → `parseApiError()` | Builds `ApiError` with `code`, `status`, `message`, `request_id`, `details` |
| Toast copy | `messageForApiError()` | Malay defaults per `code` / HTTP status |
| Field errors | `fieldErrorsFromApiError()` | Reads `details` / `details.fields` when present |

### Common codes

| Code | HTTP | Frontend message (default) |
|------|------|----------------------------|
| `unauthenticated` | 401 | Sila log masuk semula. |
| `not_permitted`, `forbidden` | 403 | Anda tidak dibenarkan… |
| `not_found` | 404 | Rekod tidak dijumpai. |
| `conflict`, `already_claimed` | 409 | Rekod bercanggah / sudah dituntut |
| `expired`, `gone` | 410 | Pautan/token tamat tempoh |
| `unprocessable` | 422 | Maklumat tidak sah |
| `invalid_argument` | 400 | Parameter permintaan tidak sah |
| `rate_limited` | 429 | Terlalu banyak percubaan |

**Validation:** Most handlers today put human text in `error.message` with empty `details`. Form pages should show `message` until structured field errors ship.

## Paginated lists

Backend shape (`PaginatedResp`):

```json
{
  "data": [],
  "total": 0,
  "page": 1,
  "per_page": 20,
  "total_pages": 0,
  "has_more": false
}
```

Query parameters:

- `page` — positive integer, default `1`
- `per_page` — 1–100, default `20`

Client:

- Type: `PaginatedResponse<T>` in `lib/infrastructure/api/types.ts`
- Domain: `PaginatedResult<T>` in `lib/domain/pagination.ts`
- Mapper: `mapPaginated()` in `lib/infrastructure/api/mappers/care.ts`
- Query builder: `toListQuery()` appends `page`, `per_page`, optional filters

Used by care logs, appointments, tasks, vitals, documents, medications, and timeline list endpoints.

### Timeline

`GET /care-profiles/{profileId}/timeline` returns the same paginated shape as care logs (`PaginatedResp` of normalized care-log rows). Backend timeline is care logs only today — not a cross-resource aggregation. Mock mode still builds a local multi-kind timeline via `buildTimeline()`.

## Invite & claim deep links

Backend accepts tokens only in **POST body**, never GET path/query (see backend doc 04).

| Action | API | Body |
|--------|-----|------|
| Accept invite | `POST /api/v1/invites/accept` | `{ "token": "…" }` |
| Accept claim | `POST /api/v1/claims/accept` | `{ "token": "…" }` |

### Web routes

| Purpose | Route |
|---------|-------|
| Email / SMS link (public) | `/accept/invite#token=…` or `/accept/claim#token=…` |
| In-app acceptance (auth required) | `/invites/accept` or `/claims/accept` |

Flow:

1. Landing page captures `#token=` into `sessionStorage` (fragment never hits server logs).
2. User logs in if needed (`/?next=/invites/accept`).
3. Accept page reads stored token and calls API.

Helpers: `lib/application/deep-links.ts`

**Do not** use `?token=` in shareable links (legacy query still read client-side for dev/mock).

## Care profile DTO gaps

Backend `profileResp` fields: `id`, `display_name`, `subject_user_id`, `role`, `permissions`, `status`.

UI fields **not** persisted in API mode yet (see `lib/application/care-profile-field-gaps.ts`):

| UI field | Status |
|----------|--------|
| `relation` | Mock / local only |
| `dateOfBirth` | Mock / local only |
| `notes` | Mock / local only |
| `circleId` | Derived from `GET /care-circles` membership, not on profile DTO |

Medication UI gaps (`prescribedBy`, `startDate`, `endDate`) — backend medication DTO currently exposes `name`, `dosage`, `instructions`, `before_after_meal`, `status` only.

## References

- Backend contract: `kasihbersama-backend/docs/06-api-contract.md`
- Claim/invite security: `kasihbersama-backend/docs/04-claim-invite-transfer.md`
- Client error helper: `lib/infrastructure/api/errors.ts`
- Client pagination types: `lib/infrastructure/api/types.ts`, `lib/domain/pagination.ts`

## Browser → API (CORS proxy)

The staging backend does not emit `Access-Control-Allow-Origin` for browser origins. The Next.js app therefore:

1. Rewrites `/api/v1/:path*` → `NEXT_PUBLIC_API_BASE_URL/api/v1/:path*` (`next.config.ts`)
2. Uses same-origin `/api/v1` in the browser (`getApiBaseUrl()` returns `""` on client)
3. Excludes `/api/*` from auth `proxy.ts` so unauthenticated pre-auth calls (login, forgot-password) are not redirected to `/`

Restart `next dev` after changing `NEXT_PUBLIC_API_BASE_URL` or rewrite config.
