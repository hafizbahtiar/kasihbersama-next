## P0 — Asas backend integration

- [x] Bina API client untuk backend `/api/v1`
- [x] Implement auth sebenar: login, register, refresh token, logout
- [x] Tambah session storage, route protection, dan auth error states
- [x] Tambah verify email, forgot password, dan reset password flow
- [x] Tambah `care-profile` context/selector untuk semua data jagaan
- [x] Gantikan mock repository dengan repository yang menggunakan API
- [x] Tambah loading, error, retry, validation, dan empty states
- [x] Sambungkan create/edit resource kepada backend
- [x] Tambah delete action dengan confirmation
- [x] Guna pagination/filter/sort server-side mengikut response backend (contoh: log jagaan)

## P1 — Domain care utama

- [x] Profile jagaan: detail, edit, archive, status, permissions
- [x] Care circle: create, list, detail, link profile, archive
- [x] Ahli & akses: invite, revoke, accept, claim request, role, permissions
- [x] Timeline care profile
- [x] Care logs berstruktur: log type, body, visibility, occurred time
- [x] Ubat: detail fields, prescriber, instructions, start/end date
- [x] Medication schedules: daily, weekly, multi-daily, as-needed, timezone
- [x] Medication events: taken, skipped, postponed, missed
- [x] Temujanji: doctor, masa, notes, calendar, completed/cancelled/missed
- [x] Tugasan: description, assignment, due time, completion workflow
- [x] Bacaan vital: numeric/text values, unit, systolic/diastolic, notes
- [x] Carta trend untuk bacaan vital
- [x] Dokumen: file picker, upload progress, validation, metadata, download, delete

## P1 — Account, notification, dan device

- [x] Sambungkan `/me` untuk profile display name dan email verification status
- [x] Selaraskan settings dengan notification preferences berasaskan care profile
- [x] Sokong channel dan reminder type notification
- [x] Sambungkan device token list
- [x] Tambah revoke/remove device
- [x] Tambah logout semua peranti
- [x] Tambah push permission/onboarding dan deep-link medication reminder
- [x] Tentukan API notification inbox; backend sekarang hanya expose preferences/delivery
- [x] Buang atau tandakan jelas admin notification UI sehingga backend endpoint tersedia

## P2 — Dashboard dan platform

- [x] Sambungkan dashboard kepada data sebenar atau tambah dashboard aggregation endpoint
- [x] Consume `/api/v1/bootstrap`
- [x] Feature flags: caregiver mode, doctor summary, document upload, profile claim
- [x] Force-update screen berdasarkan minimum supported build
- [x] Paparkan quota profile/member/upload
- [x] Gunakan role dan permissions backend untuk hide/disable actions
- [x] Emergency card dan export summary jika endpoint backend disediakan
- [x] Doctor summary jika endpoint backend disediakan
- [x] Audit/history UI jika endpoint backend disediakan

## Cleanup dan UX

- [x] Sambungkan header search atau buang input yang belum berfungsi
- [x] Gantikan hubungan profile berbentuk teks dengan reference/selectors
- [x] Tambah field-level validation untuk tarikh, masa, dosage, vital, dan upload
- [x] Tambah optimistic update/conflict handling jika diperlukan
- [x] Selaraskan status frontend dengan enum backend
- [x] Tambah responsive detail views untuk domain-specific workflows

## Backend/frontend contract checks

- [x] Dokumentasikan error response dan mapping field validation
- [x] Dokumentasikan paginated response shape
- [x] Sahkan notification inbox/admin notification API sebelum membina persistence UI
- [x] Sahkan rich medical profile fields yang belum exposed oleh DTO backend
- [x] Sahkan route/deep-link format untuk invite dan claim acceptance

---

## P3 — Sambung semua API

- [x] Buang/mock fallback bila `NEXT_PUBLIC_API_BASE_URL` diset; pastikan semua halaman guna repository API
- [x] Ganti semua toast/copy `UI sahaja` dengan maklum balas API sebenar (profil, kumpulan, ubat, temujanji, tugasan, dokumen)
- [x] Hantar header klien pada setiap request: `X-App-Build`, `X-App-Platform`, `X-API-Version`
- [x] Tambah `Idempotency-Key` pada mutasi yang memerlukan (invite/claim accept, medication action, upload complete)
- [x] Dokumen: aliran upload intent → complete → metadata (`/uploads/intents`, `/uploads/{id}/complete`)
- [x] Dokumen: muat turun melalui `GET …/documents/{id}/download-url` (bukan toast demo)
- [x] Pagination server-side untuk semua senarai (ubat, temujanji, tugasan, vital, dokumen, ahli) — ahli tiada pagination backend; senarai lain siap
- [x] Timeline profil dari `GET /care-profiles/{id}/timeline` (gantikan agregasi snapshot tempatan) _(API = log jagaan sahaja; mock kekal agregasi penuh)_
- [x] Ahli & akses: `GET /care-profiles/{id}/members` (access review), kemas kini peranan melalui API
- [x] Ubat: schedules & events dari API; padam `prescribedBy` / tarikh mock apabila DTO backend sedia _(jadual/events API; medan mock disembunyikan dalam mod API)_
- [x] Profil jagaan: persist `relation`, tarikh lahir, nota apabila backend menambah medan DTO _(borang API hanya `display_name`; medan gap disembunyikan)_
- [ ] Platform: sambung emergency card, doctor summary, audit apabila endpoint backend tersedia _(disahkan 2026-09-09: `summaries/doctor-visit`, `summaries/{id}/pdf-url`, `audit-events` dan emergency card semuanya tiada dalam `server.go` walaupun ada dalam kontrak)_
- [x] Device: daftar/revoke push token melalui API (bukan mock subscription id) _(revoke/list via API; daftar hanya ios/android di backend)_
- [x] Buang `ResourceSnapshotProvider` / mock notification seed apabila tiada endpoint legacy diperlukan
- [x] Selaraskan path repository dengan kontrak (contoh: verify `care-logs` vs `logs` pada semua resource)

## P3 — Cater auth

- [x] Google sign-in: sambung atau buang butang placeholder pada login/register _(butang dinyahdayakan)_
- [ ] Phone auth: `POST /auth/phone/start` + `/auth/phone/verify` — ditangguh (kontrak docs sahaja, route belum didaftarkan di backend)
- [x] Gate tindakan sensitif jika `email_verified === false` (jemputan, tuntutan, upload, dll.)
- [x] Halaman verify email: auto-terima token dari pautan + state selepas login
- [x] Refresh token: handle 401 global, retry sekali, logout bersih jika refresh gagal
- [x] Middleware: elak redirect loop; bawa `next` + token invite/claim selepas login
- [x] Cookie `kb-refresh-token`: selaraskan TTL, `Secure`/`SameSite` untuk production _(TTL via `NEXT_PUBLIC_SESSION_MAX_AGE_DAYS`, `Secure` on HTTPS, `SameSite=Lax`)_
- [x] Rate limit UX untuk login/signup/forgot (papar mesej `rate_limited` / `locked`)
- [x] Logout all devices: pastikan semua tab/client state direset selepas `POST /auth/logout-all` _(BroadcastChannel + storage sync, clear profil dipilih)_
- [ ] Akaun: `POST /me/delete` apabila backend Module 3 sedia _(disahkan 2026-09-09: masih tiada route; tapak pemasaran mengiklankan patuh PDPA, jadi ini lebih dari sekadar nice-to-have)_
- [x] Ujian aliran: signup → verify → login → refresh → logout → forgot → reset _(skrip: `npm run smoke:auth`)_

---

## Audit penuh (2026-09-09)

Route backend dibaca terus dari `internal/transport/http/server.go` dan dibandingkan
dengan `docs/06-api-contract.md`.

### Menyekat — pengesahan e-mel jalan mati

- [ ] **Tiada UI "hantar semula e-mel pengesahan"**, kerana backend tiada endpointnya.
  E-mel dihantar sekali sahaja semasa signup dan luput dalam 24 jam. Halaman
  `/verify-email` hanya menerima token yang sudah ada di tangan — ia tak boleh meminta
  yang baharu. Akaun yang terlepas tempoh itu kekal tak sah selama-lamanya, dan
  `EmailVerifiedGate` menyekat jemputan serta tuntutan untuk akaun sedemikian.
  Bergantung pada `POST /auth/resend-verification` di backend; bina butang pada
  `verify-email-form.tsx` sebaik ia wujud.

### Belum siap kerana backend belum ada surface

- [ ] Circle: tambah/buang ahli circle _(`care_circle_members` ada jadual dan lajur
  peranan, tapi tiada route HTTP — profil boleh dipaut ke circle, orang tidak boleh)_
- [ ] Circle: kemas kini circle _(`PATCH /care-circles/{id}` tak didaftarkan; hanya
  create/read/delete)_
- [ ] Medan profil `relation`, `dateOfBirth`, `notes` masih disembunyikan dalam mod API
  _(`care-profile-field-gaps.ts` — DTO backend belum ada medan ini)_
- [ ] Medan ubat `prescribedBy`, `startDate`, `endDate` — sama

### Selesai sesi ini (2026-09-09)

- [x] Snapshot jagaan mati sepenuhnya apabila satu endpoint gagal — `Promise.all` dalam
  `loadProfileData` membuang sepuluh respons berjaya kerana satu 400. Setiap seksyen kini
  merosot sendiri-sendiri; 401 kekal fatal supaya sesi luput tak dipaparkan sebagai
  "tiada data".
- [x] `medication-events` dipanggil tanpa `from`/`to` yang backend wajibkan → 400 →
  dashboard kosong → semua permission dibaca `false`. Kini menghantar tingkap 7 hari.
- [x] Setiap pautan (sidebar, breadcrumb, `LinkButton`) ialah `Link` react-aria tanpa
  `RouterProvider`, jadi setiap klik memuat semula dokumen penuh. Disambungkan ke router Next.
- [x] Skrin "Memuatkan sesi" ialah skeleton kandungan yang direka untuk dalam shell, jadi
  ia terdampar di kiri atas viewport kosong. Kini komponen tersendiri, penuh-viewport dan
  bertengah.
- [x] `CareDataProvider` 1006 → 668 baris: 37 daripada 38 kaedah membawa implementasi mock
  inline yang menduplikasi `InMemoryCareRepository`. Punca sebenar ialah `refresh()` pulang
  awal dalam mod mock; membaikinya memusnahkan sebab duplikasi itu.
- [x] `CareRepository` 48 kaedah dipecah kepada sepuluh interface ikut agregat.
  `createResourceSnapshot` kini meminta `CareSnapshotReader` sahaja dan menerimanya sebagai
  parameter — sekali gus menutup pelanggaran lapisan `application → composition`.
- [x] `bun.lock` tak sepadan `package.json`; setiap build Railway gagal pada
  `--frozen-lockfile`.
- [x] Proxy `/api/v1/*` boleh guna `API_INTERNAL_BASE_URL` (rangkaian private Railway).
  Nota: nilainya mesti `http://` dan berport `:8080` — rangkaian private tiada TLS.
- [x] Semua pemboleh ubah env yang dibaca kod kini didokumen dalam `.env`/`.env.example`
  _(`NEXT_PUBLIC_API_VERSION` dan `NEXT_PUBLIC_APP_PLATFORM` sebelum ini tiada dalam kedua-duanya)_

### Perlu disahkan, bukan dakwaan

- [ ] Navigasi client-side belum disahkan pada tahap klik — tiada pelayar dalam sesi itu.
  Semak DevTools → Network: satu fetch `?_rsc=` bermakna berjaya; permintaan dokumen penuh
  bermakna belum.
- [ ] `smoke:auth` melangkau langkah verify (lihat header skripnya). Ia tak boleh lengkap
  sehingga endpoint resend wujud.
