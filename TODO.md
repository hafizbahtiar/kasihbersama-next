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

### Pengesahan e-mel berfungsi; pemulihan selepas terlepas tempoh tidak

Dibetulkan 2026-09-09 selepas diuji, bukan sekadar dibaca. Nota terdahulu di sini
mendakwa e-mel pengesahan tak pernah dibina. Ia dibina dan ia sampai — pendaftaran
ujian terhadap staging menghasilkan rekod Resend "Verify your KasihBersama email"
dengan `last_event: delivered`. Akaun yang tak menerimanya didaftarkan 11 jam sebelum
domain penghantar disahkan di Resend.

- [ ] **Tiada UI "hantar semula e-mel pengesahan"**, kerana backend tiada endpointnya.
  Itu gap sebenar: token hidup 24 jam, dan selepas luput tiada jalan mendapat yang
  baharu. Halaman `/verify-email` hanya menerima token yang sudah ada di tangan.
  `EmailVerifiedGate` kemudian menyekat jemputan dan tuntutan untuk akaun sedemikian.
  Bergantung pada `POST /auth/resend-verification`; bina butang pada
  `verify-email-form.tsx` sebaik ia wujud.

### Belum siap kerana backend belum ada surface

- [ ] Circle: tambah/buang ahli circle _(`care_circle_members` ada jadual dan lajur
  peranan, tapi tiada route HTTP — profil boleh dipaut ke circle, orang tidak boleh)_
- [ ] Circle: kemas kini circle _(`PATCH /care-circles/{id}` tak didaftarkan; hanya
  create/read/delete)_
- [ ] Medan profil `relation` dan `notes` masih disembunyikan dalam mod API
  _(tiada lajur langsung dalam `care_profiles` — perlu migrasi dahulu, bukan sekadar DTO)_

### Selesai sesi ini (2026-09-09)

- [x] **Medan yang backend pulangkan tetapi frontend buang, kini disambung.**
  `date_of_birth` (profil) dan `start_date`/`end_date`/`prescribed_by` (ubat) ditambah ke
  DTO backend awal sesi ini, tetapi mapper frontend masih menulis `""` ke atasnya dan
  borang masih dipagar `!apiMode`. Borang mengumpul data yang ia buang.
  - Tarikh kosong dihantar sebagai **kunci tiada**, bukan `""` — lajur ini di-COALESCE,
    jadi rentetan kosong akan memadam nilai tersimpan.
  - Backend: `createMedicationReq.start_date` dahulunya RFC3339 sedangkan responsnya
    `YYYY-MM-DD`. Borang yang membaca ubat dan menyimpannya semula ditolak atas datanya
    sendiri. Kini ISO dua-dua arah, dengan ujian round-trip.
- [x] **Sampul ralat 429 kini JSON.** `ratelimit` tak boleh import lapisan transport (kitaran
  import), jadi ia guna `http.Error` dan menjawab text/plain sedangkan semua ralat lain JSON.
  Klien gagal parse → jatuh ke "Ralat pelayan. Cuba lagi." — nasihat yang betul-betul
  bertentangan dengan apa yang had kadar itu minta. Sampul dipindah ke `internal/apierr`
  (pakej daun), kod `rate_limited` kini benar-benar dihantar.
- [x] **Keselamatan akaun (Modul 2 backend) kini ada UI.** Tab baharu "Keselamatan" dalam
  Tetapan: tukar kata laluan dan tukar e-mel, kedua-duanya berpagar kata laluan semasa.
  Tab "Sesi" kini menyenaraikan peranti yang log masuk (`GET /me/sessions`) dengan lencana
  "Peranti ini" dan butang tamatkan bagi yang lain.
  - 401 pada dua borang ini **tidak** boleh guna teks kongsi "Sila log masuk semula" — sesi
    pengguna elok, kata laluan dalam borang yang salah. Ia dipetakan ke ralat medan.
  - Backend memisahkan dua sebab 409 kepada kod `pending_invites` dan `email_taken`;
    satu kod `conflict` tak boleh diterjemah tepat.
  - Sesi semasa tiada butang "Tamatkan" — ia kelihatan seperti tindakan keselamatan
    sedangkan hasilnya cuma log keluar dari peranti di depan mata. Itu kerja butang
    "Log keluar" di bawahnya.
  - Repositori mock menguatkuasakan kata laluan seednya (`katalaluanlama`), jadi keadaan
    gagal boleh dilihat dalam mod demo.
  - `skipRefresh: true` pada dua borang ini: 401 di sini bermakna kata laluan dalam borang
    salah, bukan sesi luput. Tanpanya klien membelanjakan satu putaran refresh token pada
    setiap salah taip, dan pengguna yang refreshnya gagal dilog keluar kerana tersalah
    taip kata laluan sendiri.
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

---

## Audit aliran UX (2026-09-09)

Diukur dari kod, bukan diandaikan. Borang itu sendiri elok — tarikh/masa memang
diisi lalai dengan masa sekarang, dan borang vital adaptif (sistolik/diastolik
hanya untuk tekanan darah, unit auto-set dari jenis). Geserannya **antara**
borang: cara pengguna tiba, dan apa berlaku selepas simpan.

### Menyekat pada telefon

- [ ] **Switcher profil desktop sahaja, tapi semua borang bergantung padanya.**
  `app-header.tsx:55` ialah satu-satunya `ProfileSwitcher` dalam kod, dan ia
  `hidden sm:flex`. Sidebar tak menunjukkan profil terpilih. Jadi pada telefon
  kelima-lima borang render penuh, butang hantar `isDisabled` senyap, dan teks
  bantuannya berkata "Pilih profil jagaan di header dahulu" — kawalan yang tiada
  pada saiz skrin itu. Ini aplikasi yang digunakan di sisi katil.
  Perlu: switcher dalam sidebar (ada pada semua saiz), dan borang patut tunjuk
  `Empty` + "Pilih profil" daripada merender medan yang tak boleh dihantar.

### Dashboard tak boleh diklik

- [ ] **Sifar elemen interaktif.** `grep -cE "href=|onPress=|Button"` pada
  `dashboard-page.tsx` = 0. Jubin statistik dan dua carta, tiada satu pautan.
  `buildDashboardStats` mengira `openTaskCount` dan `upcomingAppointmentCount` —
  tepat perkara yang pengguna mahu klik terus.
  Perlu: setiap jubin jadi pautan ke senarainya. Perubahan paling murah di sini.

### Tindakan paling kerap, tiga lapis dalam

- [ ] **Menanda dos hanya ada di satu tempat**, `medication-detail-page.tsx:183`.
  Laluannya: Laman utama → Ubat → buka ubat → cari baris dos → tanda. Tiga
  navigasi, beberapa kali sehari, untuk tindakan paling kerap dalam aplikasi
  penjejak ubat. Dan `buildDashboardStats` tak mengira dos tertunggak sama sekali.
  Perlu: senarai "Dos hari ini" pada dashboard dengan tindakan tanda di situ.
  Kesan paling besar antara keempat ini.

### Satu borang, satu rekod

- [ ] **Tiada "Simpan dan tambah lagi".** Borang ubat ialah contoh terbaik dalam
  projek ini — ia cipta ubat *dan* jadual pertamanya dalam satu hantar, kemudian
  mendarat di halaman butiran (`medication-detail-page.tsx:558`). Tiada borang lain
  berkelakuan begitu; log, vital, tugasan, temujanji semuanya kembali ke senarai,
  jadi "rekod dua bacaan" ialah dua perjalanan penuh.
  Perlu: satu prop pada `CareFormShell`, memberi manfaat kepada ketujuh borang.

### Had audit ini

- [ ] Semuanya dibaca dari kod. Tiada pelayar dalam sesi itu, jadi susunan kesan di
  atas belum disahkan terhadap penggunaan sebenar. Cuba pada telefon sebenar untuk
  mengesahkan atau menolaknya.

---

## Info kesihatan dan profil diri (2026-09-09)

Disemak terhadap skema DB sebenar, bukan terhadap `care-profile-field-gaps.ts`.

### `care-profile-field-gaps.ts` salah, bukan sekadar tidak lengkap

- [ ] Ia menyenaraikan jurang sebagai `relation`, `dateOfBirth`, `notes`. Dua daripada
  tiga nama itu **tiada dalam jadual** `care_profiles`. Yang sebenarnya ada, sudah
  dimigrasi dan sudah dimuat pada setiap bacaan backend:

      legal_name, date_of_birth, gender, blood_type, allergy_summary,
      condition_summary, primary_clinic, primary_doctor, emergency_note

  Sembilan lajur, dan `ProfileView` backend tak memulangkan satu pun. Fail ini perlu
  dibetulkan supaya ia menamakan medan yang wujud — kalau tidak ia menyembunyikan
  medan yang salah dan memberi gambaran jurang itu kecil.

### Borang profil menunggu satu perubahan DTO

- [ ] Borang cipta/sunting profil hanya menghantar `display_name`, sebab itu sahaja yang
  `updateProfileReq` terima. Sebaik backend mendedahkan sembilan medan itu (perubahan
  DTO, bukan migrasi — data sudah dalam memori), borang ini boleh mengumpul tarikh
  lahir, jenis darah, alahan, keadaan, klinik dan doktor.
  Bergantung pada entri "DTO gaps" dalam TODO backend.

### Kad kecemasan: UI ada, data ada, endpoint tiada

- [ ] `can_view_emergency_card` sudah ditapis dalam `platform-features-section.tsx` dan
  `lib/domain/care.ts`, dan lajur `emergency_note` sudah dimigrasi — tetapi tiada
  endpoint menghubungkannya. Bahagian frontend sudah sedia; ia menunggu backend.

### Tiada modul kesihatan diri sendiri

- [ ] Tiada halaman untuk maklumat kesihatan pengguna sendiri (jenis darah, tarikh lahir,
  tinggi). `/me` memulangkan empat medan sahaja — id, e-mel, nama paparan, status
  pengesahan — dan `PATCH /me` menerima satu. Settings menunjukkan tepat apa yang ada.

  Keputusan reka bentuk ada di sebelah backend: sama ada "kesihatan saya" ialah profil
  jagaan yang subjeknya diri sendiri (guna semula segalanya yang sedia ada), atau medan
  baharu pada `users` (menduakan model). Kalau pilihan pertama menang, kerja frontendnya
  kecil — halaman itu ialah halaman profil jagaan sedia ada.

  Nota: `tinggi` tiada dalam mana-mana jadual, jadi ia perlu migrasi walau apa pun.

