# KasihBersama Next TODO

Open work only. Completed items are removed rather than accumulated - the reasoning for
anything shipped lives in the code comment next to it and in the commit that made it. Use
`git log` for the record.

Verification: `npm run typecheck && npm run lint && npm run build`. There is no unit test
framework here, so the type system is the safety net: several guards in `lib/domain` and
`lib/infrastructure` are exhaustive `Record`s specifically so a missing case fails to
compile.

## Blocked on something outside this repo

- [ ] **Phone auth** (`POST /auth/phone/start` + `/auth/phone/verify`). Designed in the
  backend (`docs/superpowers/specs/2026-09-10-phone-verification-design.md`) but the
  routes are not registered, and it needs an SMS provider account before it can be.
- [ ] **Profile `relation` and `notes`** stay hidden in API mode. There is no column for
  either in `care_profiles`, so this needs a migration first, not just a DTO change.
- [ ] **Milestone checklist content is a placeholder**, marked `source: "placeholder"`
  with a notice in the UI. The real source - the KKM *Buku Rekod*, or a
  permissively-licensed reference such as the CDC's - is a licensing and clinical-content
  decision. The WHO growth tables are the standing example of why guessing it is
  expensive.

## From the 2026-09-20 settings audit

Checked against the RUNNING backend (OpenAPI + real flows), not a code read.

- [x] Every Settings call maps to a real backend route: `/me`, `/me/settings`,
      `/auth/sessions` (and `/{id}`, `DELETE`), `/auth/devices` (and `/{id}`, `/{id}/trust`),
      `/auth/mfa/totp/enroll|confirm`, `/auth/verify-email`, `/auth/verification/resend`,
      `/auth/password/change`, `/auth/email/change` (+`/confirm`), `/auth/account/delete`.
      Response shapes match (MFA `{secret, otpauth_url}` / `{recovery_codes}`, sessions
      `{data, meta}`, settings `{settings: {...}}`)
- [x] Flows verified end to end against the local API: register → verification link (logged
      by the backend) → verify email → `/me` `email_verified=true`; resend; change password
      (old rejected afterwards, new works). Settings can be exercised locally today
- [x] Invitation email links now target `/accept/invite#token=…` - the backend's circle
      mailer used to build `/accept-invitation?token=…`, which 404s on this app. It matches
      `INVITE_ACCEPT_LANDING_PATH` and the fragment convention in `deep-links.ts`
- [ ] `/me/export` - no backend route and no spec in docs. The UI already reports it as
      unavailable through `notYetAvailable`, but the export button cannot work until the
      format, scope, and sync-vs-link question is decided
- [x] `/me/health-profile` - backend `GET/PUT /v1/me/health-profile` siap (2026-09-21).
      UI: skrin "Kad kecemasan" (sidebar Akaun → /self-health) memanggilnya. Akaun tanpa
      pengikatan: GET `{exists:false}` (borang kosong), PUT ditolak 409 dengan mesej pelayan
- [ ] `/me/usage` - no backend route yet (billing phase 3). The UI degrades to "not available
      yet" on purpose; nothing to do until then

Local dev note: the backend does NOT send email (log mailer). The verification link is in the
API log: `grep -o '"pautan":"[^"]*"' <api log> | tail -1`. `PUBLIC_WEB_BASE_URL=http://localhost:3000`
must be set in the backend's `.env.dev` or that link is relative and unclickable.

## Needs a browser, not a code read

These were all concluded by reading source. No browser was available in the sessions that
wrote them, so each is a claim rather than an observation.

- [ ] **Client-side navigation** has not been confirmed at the click level. Check
  DevTools → Network: a single `?_rsc=` fetch means it worked, a full document request
  means it did not.
- [ ] **Form control alignment** has not been checked by eye. Every control now takes its
  height from `components/ui/control-size.ts`, but that is a compile-time guarantee about
  a prop, not about what renders. Open one form and confirm the text field, date picker,
  its calendar button and the `Select` all sit on one line.
- [ ] **The UX ordering above** was derived from code, not from use. Try it on a real
  phone to confirm or overturn it.

## Ready to build

- [ ] **`smoke:auth` still skips the verify step** (see the script header). No longer
  blocked: `POST /auth/resend-verification` has existed since 2026-09-09, so the script
  can be completed.
