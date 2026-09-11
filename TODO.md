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

## Found in use, 2026-09-11

Both came from actually opening the app, and neither would have surfaced from
reading code - which is the argument for the section below.

- [x] **Growth chart said "Rekod tidak dijumpai."** The route is gated behind
  `FEATURE_GROWTH_CHART`, which answers 404 when off - indistinguishable from a missing
  record at the transport layer, so the client rendered the generic not-found message.
  Bootstrap now advertises `growth_chart`, the nav entry hides while it is off, and the
  page says plainly that the feature is waiting on WHO data if reached by URL.
- [x] **No date-of-birth field existed anywhere in API mode.** It sat inside the create
  form's `{!apiMode ? ...}` block, and the health-fields card did not carry it - while the
  form was still *sending* `date_of_birth` on save, so the value posted was always empty.
  Both the immunisation book and the growth chart require it, so their preconditions could
  never be met through any screen. The field is now outside that block and on the health
  card.
  The notice above it also claimed "tarikh lahir disimpan", which was not true in the mode
  it was shown in.

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
- [ ] **No "Save and add another".** The medication form is the best example in the
  project - it creates a medication *and* its first schedule in one submit, then lands on
  the detail page (`medication-detail-page.tsx:558`). No other form behaves that way;
  logs, vitals, tasks and appointments all return to the list, so "record two readings"
  is two full round trips.
  One prop on `CareFormShell` would give this to all seven forms.
