# Frontend API contract notes

This document mirrors [`kasihbersama-backend/docs/06-api-contract.md`](../../kasihbersama-backend/docs/06-api-contract.md) for the Next.js client. Implementation lives under `lib/infrastructure/api/`.

## Error envelope

Backend JSON (all non-2xx), v0.2 (`internal/platform/httpx/apierror.go`):

```json
{
  "error": {
    "code": "auth.password.weak",
    "message": "Kata laluan terlalu lemah",
    "details": [{ "field": "body.password", "issue": "expected length >= 10" }],
    "request_id": "01J…"
  }
}
```

`code` is stable and machine-readable, `message` is human and never parsed, and
`details` is **always an array** of `{field, issue}` - possibly empty.
`field` is huma's location string (`body.email`, `query.per_page`), so
`fieldErrorsFromApiError()` strips the prefix to leave the form field's key.

### Client mapping

| Layer | File | Behaviour |
|-------|------|-----------|
| Parse | `lib/infrastructure/api/errors.ts` → `parseApiError()` | Builds `ApiError` with `code`, `status`, `message`, `request_id`, `details` |
| Toast copy | `messageForApiError()` | Malay defaults per `code` / HTTP status |
| Field errors | `fieldErrorsFromApiError()` | Maps `details` to `{ field: issue }`, prefix stripped |

### Common codes - auth (v0.2)

| Code | HTTP | Frontend message (default) |
|------|------|----------------------------|
| `auth.credentials.invalid` | 401 | E-mel atau kata laluan salah. |
| `auth.required` | 401 | Sila log masuk semula. |
| `auth.session.revoked` | 401 | Sesi telah ditamatkan. Sila log masuk semula. |
| `auth.email.unverified` | 403 | Sahkan e-mel anda dahulu. |
| `auth.email.taken` | 409 | E-mel ini sudah didaftarkan pada akaun lain. |
| `auth.password.weak` | 400 | Kata laluan mesti sekurang-kurangnya 10 aksara. |
| `auth.account.locked` | 429 | Terlalu banyak cubaan gagal. Akaun dikunci sementara. |
| `auth.token.invalid` | 400 | Pautan atau token tidak sah, atau sudah tamat. |
| `auth.mfa.invalid` | 401 | Kod MFA tidak sah atau sudah tamat. |
| `request.invalid` | 400/422 | Maklumat tidak sah. Semak semula borang. |
| `rate_limit.exceeded` | 429 | Terlalu banyak percubaan. Cuba lagi kemudian. |
| `internal.error` | 500 | Ralat pelayan. Cuba lagi. |

### Common codes - care (v0.1, not yet migrated)

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

The care endpoints still answer the v0.1 shape (`details` as an object, bare
codes). `deletionBlockersFromError()` and `api-growth-repository.ts` carry a
narrow cast for it; both go when the care endpoints move to v0.2.

### Plan limits (docs/09)

| Code | HTTP | Frontend message (default) |
|------|------|----------------------------|
| `billing.limit.reached` | 403 | *(empty - the server's message names the limit and the object, e.g. "Pelan percuma terhad kepada 3 person bagi setiap circle.")* |
| `storage.quota.exceeded` | 413 | Kuota storan circle penuh |

A plan limit is **not** a permission refusal: the caller may do this on a paid
plan, so the copy names the ceiling rather than the role. Storage stays 413
because it is an entity-size limit, and the copy tells the reader to free space.

`GET /v1/me/usage` (`lib/infrastructure/api/api-account-repository.ts`) is the
only place the client learns the ceilings:

```json
{
  "plan": "free",
  "limits": { "owned_circles": 1, "persons_per_circle": 3, "members_per_circle": 3, "storage_bytes_per_circle": 262144000 },
  "usage": { "owned_circles": 1, "circle": { "id": "…", "person_count": 2, "member_count": 2, "storage_bytes": 0 } }
}
```

Three states, three shapes in `limits`: **absent** = no scope (no `circle_id`
sent), **null** = no ceiling, **number** = the ceiling. `usage.circle` is null
when the caller has no active circle. Bootstrap also carries
`platform.limits.max_owned_circles`, which is what hides the "Cipta circle"
button before the server has to refuse it.

## Auth (backend v0.2)

Base: browser calls same-origin `/api/v1/*`; the rewrite sends it to the
backend's `/v1/*` (`next.config.ts`).

| Action | Backend route | Body | Response |
|--------|---------------|------|----------|
| Register | `POST /v1/auth/register` | `{email, password, display_name}` | **201** `{user}` - **no tokens** |
| Login | `POST /v1/auth/login` | `{email, password}` | `{user, tokens}` **or** `{mfa_required, challenge_token}` |
| MFA verify | `POST /v1/auth/mfa/verify` | `{challenge_token, code}` | `{tokens}` |
| Refresh | `POST /v1/auth/refresh` | `{refresh_token}` | `{tokens}` |
| Logout | `POST /v1/auth/logout` | - (auth header) | `{message}` |
| Revoke all sessions | `DELETE /v1/auth/sessions` | - | `{message}` |
| Verify email | `POST /v1/auth/verify-email` | `{token}` | `{message}` |
| Resend verification | `POST /v1/auth/verification/resend` | `{email}` | `{message}` |
| Forgot password | `POST /v1/auth/password/forgot` | `{email}` | `{message}` |
| Reset password | `POST /v1/auth/password/reset` | `{token, password}` | `{message}` |
| Current user | `GET /v1/auth/me` | - | `{user, session}` |

`tokens` is `{access_token, access_expires_at, refresh_token,
refresh_expires_at, token_type}`; only the two token strings are mapped into the
domain, and `ApiTokenDTO` is unwrapped inside `ApiAuthRepository` so nothing
downstream sees the envelope.

Three behaviours worth remembering:

- **Register does not sign in.** It answers 201 with the user and no session, and
  the backend refuses login with `403 auth.email.unverified` until the address is
  confirmed. The register form therefore routes to
  `/verify-email?email=…` rather than into the app.
- **MFA is an outcome, not an error.** `POST /v1/auth/login` answers 200 with
  `{mfa_required, challenge_token}` when the password was right and a second
  factor is enrolled. `AuthRepository.login` returns `LoginOutcome` and the form
  switches to a code step.
- **Logout needs the access token.** Revocation is keyed on the session the
  access token names, so `AuthProvider.logout()` calls the API *before* clearing
  local tokens - clearing first would send an unauthenticated request.

Tokens are opaque, not JWT: the access token lives in Redis (15 min TTL) and the
refresh token in Postgres, rotating on every use.

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

- `page` - positive integer, default `1`
- `per_page` - 1–100, default `20`

Client:

- Type: `PaginatedResponse<T>` in `lib/infrastructure/api/types.ts`
- Domain: `PaginatedResult<T>` in `lib/domain/pagination.ts`
- Mapper: `mapPaginated()` in `lib/infrastructure/api/mappers/care.ts`
- Query builder: `toListQuery()` appends `page`, `per_page`, optional filters

Used by care logs, appointments, tasks, vitals, documents, medications, and timeline list endpoints.

### Timeline

`GET /care-profiles/{profileId}/timeline` returns the same paginated shape as care logs (`PaginatedResp` of normalized care-log rows). Backend timeline is care logs only today - not a cross-resource aggregation. Mock mode still builds a local multi-kind timeline via `buildTimeline()`.

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

Backend `profileResp` fields: `id`, `display_name`, `subject_user_id`, `role`,
`permissions`, `status`, plus the health columns added 2026-09-09 -
`legal_name`, `date_of_birth`, `gender`, `blood_type`, `allergy_summary`,
`condition_summary`, `primary_clinic`, `primary_doctor`, `emergency_note`.
All are optional and omitted when unknown.

UI fields **not** persisted in API mode (see `lib/application/care-profile-field-gaps.ts`):

| UI field | Status |
|----------|--------|
| `relation` | Mock / local only - no column anywhere; needs a migration first |
| `notes` | Mock / local only - same |
| `circleId` | Derived from `GET /care-circles` membership, not on profile DTO |

`dateOfBirth` left this table on 2026-09-09: it is read from `date_of_birth`
and sent on create and PATCH.

Medications now expose `start_date`, `end_date` and `prescribed_by` in both
directions. Dates are ISO `YYYY-MM-DD` on the **request as well as** the
response - the request took RFC3339 until 2026-09-09, so a form that read a
medication and wrote it back was rejected on its own data.

An empty date is sent as an **absent key**, never `""`: every one of these
columns is COALESCE-patched, so a blank string would overwrite a stored value.

## References

- Backend contract: `kasihbersama-backend/docs/06-api-contract.md`
- Claim/invite security: `kasihbersama-backend/docs/04-claim-invite-transfer.md`
- Client error helper: `lib/infrastructure/api/errors.ts`
- Client pagination types: `lib/infrastructure/api/types.ts`, `lib/domain/pagination.ts`

## Browser → API (CORS proxy)

The staging backend does not emit `Access-Control-Allow-Origin` for browser origins. The Next.js app therefore:

1. Rewrites `/api/v1/:path*` → `NEXT_PUBLIC_API_BASE_URL/v1/:path*` (`next.config.ts`) - the `/api` is dropped here because the backend serves the same routes under `/v1`
2. Uses same-origin `/api/v1` in the browser (`getApiBaseUrl()` returns `""` on client)
3. Excludes `/api/*` from auth `proxy.ts` so unauthenticated pre-auth calls (login, forgot-password) are not redirected to `/`

Restart `next dev` after changing `NEXT_PUBLIC_API_BASE_URL` or rewrite config.
