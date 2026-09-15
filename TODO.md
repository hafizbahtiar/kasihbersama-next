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

## From the 2026-09-12 module audit

A read-only agent traced every form to its request body. Ranked by harm. The
three exhaustiveness guards (`HEALTH_PATCH_KEY_SET`, `HEALTH_COLUMN`,
`EveryHealthField`) were re-checked with the delete-a-field test and all three
genuinely fail to compile - those are sound.

### Silent write failures - a success toast over a write that did not happen

- [ ] **A cleared *number* still silently does nothing.** The free-text fields are
  fixed - `""` now travels card -> provider -> body -> server, and the server
  clears the column to NULL - but `parseNumber` returns `undefined` for an empty
  Tinggi or Umur kandungan, and `undefined` is the absent signal. There is no
  clear signal for a numeric column yet; `''` is not a value the server can read
  as "remove this" for one. Needs an explicit null in the request body, which
  means the DTO must distinguish absent from null.
- [ ] **`updateSchedule` drops `status` from the PATCH body**
  (`api-care-repository.ts:818-836`). The only caller sends exactly `{status}`
  (`medication-detail-page.tsx:129`), so "Jeda" sends a PATCH with no fields, the
  badge still reads "Aktif", and doses keep generating for a medication the
  caregiver believes they paused. The mock repository applies it, so this works in
  mock mode and no-ops against the API.
- [ ] **`parseNumber` returns `undefined` for unparseable input, which is the
  absent signal** (`profile-health-fields-card.tsx:80-87`). Typing `96,5` - a comma
  is the normal decimal separator for many Malaysian users - or `1.6 m` gives
  "Profil disimpan." and no height change, with the typed text still in the box.
  Unlike the item above this one is fixable without a contract change: reject the
  input in the form instead of turning it into silence.
- [ ] **`createProfile` advertises `relation`, `notes` and `status` and forwards
  only `displayName` and `dateOfBirth`** (`care-data-provider.tsx:311-318`), in
  both modes. The create form *requires* "Hubungan" and then discards it. Harmless
  against the API today, but it is the same hand-written-literal whitelist that
  caused the health-field bug, one call above the guarded `updateProfile`.

### Data corruption

- [ ] **`uploadDocument` identifies the new document by title, then PATCHes issue
  date, expiry and notes onto whatever it finds** (`api-care-repository.ts:1138`):
  `find(item => item.title === input.title) ?? listed.data[0]`. Upload a second
  "Keputusan darah" and the new file's metadata is written onto the **older**
  document of that name, while the file just uploaded keeps none of it. The
  `?? data[0]` fallback does the same to an unrelated document when the new one is
  not on page 1. Needs the create response to carry the id.

### State the user cannot recover from

- [ ] **Any accept failure is reported as an invalid token, after the token has
  been consumed** (`care-data-provider.tsx:406-441`, `accept-token-page.tsx:122`).
  `acceptInvite`/`acceptClaim` catch everything and return `null`; the page maps
  `null` to "Token tidak sah atau sudah digunakan", and `consumeStoredToken` has
  already run. A family member on flaky data sees a valid invite read as burned,
  and reloading no longer prefills it.
- [ ] **Archiving a circle flips the page to "Kumpulan tidak dijumpai."**
  `mapCircle` never sets `archived` (`mappers/care.ts:293`) and the list API is
  scoped to active rows, so a deliberate action reads as data loss. The "Aktifkan"
  branch is unreachable, so `unarchiveCircle` cannot be invoked from the UI at all.
- [ ] **The immunisation "complete your profile" button leads to a form that
  cannot complete it** (`immunisations-page.tsx:193`). It links to `/edit`, which
  in apiMode renders only Nama and Tarikh lahir; gender lives on the detail page.
  When the missing requirement is `gender` there is no path to the fix. The growth
  chart's equivalent link points at the right page.

### Wrong or missing feedback

- [ ] **"Mula"/"Selesai" never refresh the list they render**
  (`tasks-page.tsx:84-102`). The Cancel path directly below calls
  `paginated.reload()`, as do appointments, documents, vitals and care logs - this
  is the one omission. The row keeps its "Terbuka" badge and a second press
  re-sends the same PATCH.
- [ ] **`new Date(value).toISOString()` on a clearable date field** throws
  RangeError inside the press handler (`task-form-page.tsx:51`,
  `care-log-form-page.tsx:52`). Clear "Masa akhir", press Simpan, and nothing at
  all happens - no save, no validation message, no toast. The vital and
  appointment forms guard this with `parseDateTimeLocal`.
- [ ] **The new-medication form seeds `beforeAfterMeal` with a label, not a
  value** (`medication-detail-page.tsx:512`): `useState("Selepas makan")` where the
  values are `before_meal|after_meal|with_meal|any_time`. The select renders blank,
  and submitting untouched sends the label.
- [ ] **An `ApiError` object is interpolated into the dashboard subtitle**
  (`dashboard-page.tsx:108`), rendering "ApiError: Gagal memuatkan data jagaan."
  That is the dashboard's only failure indicator, and it has no retry.
- [ ] **`milestones-page.tsx:63` uses `cause.message` instead of
  `messageForApiError(cause)`**, unlike every other catch in the area, so a signed
  out user sees the raw English backend string.
- [ ] **In apiMode the profile form's dirty check omits `dateOfBirth`, which
  apiMode sends** (`profile-form-page.tsx:44-50`). Edit only the birth date, press
  Kembali, and the "Buang perubahan?" guard does not appear - the edit is lost
  silently.
- [ ] **The Tarikh lahir DatePicker is the one control missing
  `isDisabled={!canEdit}`** (`profile-health-fields-card.tsx:145`). Nothing is
  written, since Simpan is hidden for viewers, but a `family_viewer` can type into
  a child's birth date and watch it stick.
- [ ] **Status verbs resolve to a no-op when the row is outside the snapshot**
  (`care-data-provider.tsx:568-612`). The snapshot holds 100 rows while the tasks
  table pages at 10, so past 100 tasks the buttons do nothing with no feedback.

### Latent, not yet biting

- [ ] **The exhaustiveness chain stops one hop short of the forms.**
  `ProfileHealthFieldsCard`'s submit object and `OwnHealthPage`'s `FormState` are
  hand-written literals with no guard. `FormState` already omits
  `gestationalAgeWeeks` - defensible for an adult's own record, but nothing records
  that decision - and a twelfth health field would compile everywhere while never
  being collected.
- [ ] **Stale comment in `api-growth-repository.ts:58`.** It says a 404 from the
  chart is "ambiguous by design"; the backend now answers `growth_chart_disabled`
  with its own code, so the client can tell the feature being off from a missing
  record and should.

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
