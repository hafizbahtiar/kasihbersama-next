## P0 - Asas backend integration

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

## P1 - Domain care utama

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

## P1 - Account, notification, dan device

- [x] Sambungkan `/me` untuk profile display name dan email verification status
- [x] Selaraskan settings dengan notification preferences berasaskan care profile
- [x] Sokong channel dan reminder type notification
- [x] Sambungkan device token list
- [x] Tambah revoke/remove device
- [x] Tambah logout semua peranti
- [x] Tambah push permission/onboarding dan deep-link medication reminder
- [x] Tentukan API notification inbox; backend sekarang hanya expose preferences/delivery
- [x] Buang atau tandakan jelas admin notification UI sehingga backend endpoint tersedia

## P2 - Dashboard dan platform

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

## P3 - Sambung semua API

- [x] Buang/mock fallback bila `NEXT_PUBLIC_API_BASE_URL` diset; pastikan semua halaman guna repository API
- [x] Ganti semua toast/copy `UI sahaja` dengan maklum balas API sebenar (profil, kumpulan, ubat, temujanji, tugasan, dokumen)
- [x] Hantar header klien pada setiap request: `X-App-Build`, `X-App-Platform`, `X-API-Version`
- [x] Tambah `Idempotency-Key` pada mutasi yang memerlukan (invite/claim accept, medication action, upload complete)
- [x] Dokumen: aliran upload intent → complete → metadata (`/uploads/intents`, `/uploads/{id}/complete`)
- [x] Dokumen: muat turun melalui `GET …/documents/{id}/download-url` (bukan toast demo)
- [x] Pagination server-side untuk semua senarai (ubat, temujanji, tugasan, vital, dokumen, ahli) - ahli tiada pagination backend; senarai lain siap
- [x] Timeline profil dari `GET /care-profiles/{id}/timeline` (gantikan agregasi snapshot tempatan) _(API = log jagaan sahaja; mock kekal agregasi penuh)_
- [x] Ahli & akses: `GET /care-profiles/{id}/members` (access review), kemas kini peranan melalui API
- [x] Ubat: schedules & events dari API; `prescribedBy` / `startDate` / `endDate` kini benar-benar disimpan _(DTO backend menerima dan memulangkan ketiga-tiganya sejak 2026-09-09; pagar `!apiMode` dibuang)_
- [x] Profil jagaan: tarikh lahir kini disimpan melalui API _(`relation` dan `notes` kekal mock — tiada lajur dalam DB; lapan medan kesihatan lain boleh disimpan tetapi borang belum mengumpulnya, lihat bawah)_
- [x] Platform: doctor summary dan audit disambung 2026-09-09 _(kad platform kini memaut ke halaman sebenar)_
- [x] Platform: **kad kecemasan** disambung 2026-09-09 (`/emergency-card`)
- [x] **PDF ringkasan: cetak dari pelayar, bukan endpoint backend** (2026-09-09).
  `pdf-url` dibuang daripada kontrak. Ringkasan kini ada URL sendiri
  (`/summaries/{id}`) dengan butang "Cetak / simpan PDF" dan stylesheet cetak dalam
  `globals.css` yang melucutkan sidebar, header dan toast.
  - Halaman, bukan sheet: sheet ialah portal atas keseluruhan dokumen, jadi mencetaknya
    mencetak aplikasi di belakangnya. Ia juga memberi ringkasan alamat yang boleh dibuka
    semula dan dikongsi.
  - `SummarySections` dikongsi supaya paparan skrin dan cetakan tak boleh menyimpang —
    yang menyimpang sentiasa yang tiada siapa lihat sampai doktor memegangnya.
  - Pemilih cetak disemak terhadap `app/(app)/layout.tsx`: header berada **dalam**
    `sidebar-inset`, bukan di sebelahnya. Tekaan pertama aku salah.
  - Sebab menolak PDF sisi pelayan: ia salinan kedua data perubatan at-rest yang
    `POST /me/delete` tak sentuh.
- [x] Device: daftar/revoke push token melalui API (bukan mock subscription id) _(revoke/list via API; daftar hanya ios/android di backend)_
- [x] Buang `ResourceSnapshotProvider` / mock notification seed apabila tiada endpoint legacy diperlukan
- [x] Selaraskan path repository dengan kontrak (contoh: verify `care-logs` vs `logs` pada semua resource)

## P3 - Cater auth

- [x] Google sign-in: sambung atau buang butang placeholder pada login/register _(butang dinyahdayakan)_
- [ ] Phone auth: `POST /auth/phone/start` + `/auth/phone/verify` - ditangguh (kontrak docs sahaja, route belum didaftarkan di backend)
- [x] Gate tindakan sensitif jika `email_verified === false` (jemputan, tuntutan, upload, dll.)
- [x] Halaman verify email: auto-terima token dari pautan + state selepas login
- [x] Refresh token: handle 401 global, retry sekali, logout bersih jika refresh gagal
- [x] Middleware: elak redirect loop; bawa `next` + token invite/claim selepas login
- [x] Cookie `kb-refresh-token`: selaraskan TTL, `Secure`/`SameSite` untuk production _(TTL via `NEXT_PUBLIC_SESSION_MAX_AGE_DAYS`, `Secure` on HTTPS, `SameSite=Lax`)_
- [x] Rate limit UX untuk login/signup/forgot (papar mesej `rate_limited` / `locked`)
- [x] Logout all devices: pastikan semua tab/client state direset selepas `POST /auth/logout-all` _(BroadcastChannel + storage sync, clear profil dipilih)_
- [x] Akaun: `POST /me/delete` dan `GET /me/export` disambung 2026-09-09 _(Tetapan → Data & akaun)_
- [x] Ujian aliran: signup → verify → login → refresh → logout → forgot → reset _(skrip: `npm run smoke:auth`)_

---

## Audit penuh (2026-09-09)

Route backend dibaca terus dari `internal/transport/http/server.go` dan dibandingkan
dengan `docs/06-api-contract.md`.

### Pengesahan e-mel berfungsi; pemulihan selepas terlepas tempoh tidak

Dibetulkan 2026-09-09 selepas diuji, bukan sekadar dibaca. Nota terdahulu di sini
mendakwa e-mel pengesahan tak pernah dibina. Ia dibina dan ia sampai - pendaftaran
ujian terhadap staging menghasilkan rekod Resend "Verify your KasihBersama email"
dengan `last_event: delivered`. Akaun yang tak menerimanya didaftarkan 11 jam sebelum
domain penghantar disahkan di Resend.

- [x] **UI "hantar semula e-mel pengesahan" sudah ada** (2026-09-09).
  `POST /auth/resend-verification` dibina di backend dan
  `components/auth/resend-verification-button.tsx` memanggilnya dari `/verify-email` dan
  dari Tetapan. Backend sengaja **tidak** membatalkan token terdahulu, jadi tekan kali
  kedua tak membunuh pautan yang sudah ada dalam peti masuk seseorang — itu pepijat
  sebenar yang berlaku sekali dalam sesi ini.

### Belum siap kerana backend belum ada surface

- [ ] Circle: tambah/buang ahli circle _(`care_circle_members` ada jadual dan lajur
  peranan, tapi tiada route HTTP - profil boleh dipaut ke circle, orang tidak boleh)_
- [ ] Circle: kemas kini circle _(`PATCH /care-circles/{id}` tak didaftarkan; hanya
  create/read/delete)_
- [ ] Medan profil `relation` dan `notes` masih disembunyikan dalam mod API
  _(tiada lajur langsung dalam `care_profiles` - perlu migrasi dahulu, bukan sekadar DTO)_

### Selesai sesi ini (2026-09-09)

- [x] **Pepijat: set jantina → toast berjaya → medan kosong semula.** Dua punca, satu
  setiap sisi:
  - **Backend:** `POST /me/health-profile` memulangkan rekod tersimpan dan **membuang
    medan dalam badan**. Klien yang belum memuatkan rekod menghantar POST dan bukan PATCH,
    jadi tulisan itu hilang di belakang 200. Kini ia menulis medan yang dihantar.
  - **Frontend:** borang menetapkan semula dirinya daripada `profile` pada **setiap**
    perubahan, jadi respons yang tak membawa medan itu mengosongkannya di skrin — dan
    apa-apa yang ditaip semasa muat semula latar belakang dibuang di tengah suntingan.
    Kini ia diseed sekali setiap rekod (`seededFor`), dan Simpan dilumpuhkan sehingga
    bacaan pertama mendarat supaya ia tak menghantar permintaan yang salah.
- [x] **Kad kecemasan dihalusi.** Meminjam perbendaharaan objek fizikal yang orang sudah
  kenal: nisbah 85.6×54 mm, tanda pengeluar di sudut (dalam cip pucat yang logo raster
  itu perlukan untuk terbaca), permukaan senyap dengan satu sumber cahaya lembut.
  - Satu perkara yang kuat sahaja: **blok alahan merah**. Segala yang lain sengaja rata
    supaya merah itu satu-satunya yang menjerit.
  - **Kilauan mengikut penunjuk**, dan ia berada **di luar** elemen yang berputar. Di
    dalamnya ia berputar bersama kad dan berakhir di belakang muka belakang — cahaya tak
    dicetak pada satu sisi. Aku tulis versi pertama dengan salah dan menangkapnya.
  - **Keadaan kosong dilayan:** kad yang berbunyi "Tiada direkodkan" lima kali lebih teruk
    daripada satu yang mengaku ia kosong. Kad itu berkata maklumat belum diisi, dan untuk
    rekod kau sendiri ia menawarkan butang ke `/my-health`. Untuk profil orang lain tiada
    butang — borang profil belum mengumpul lapan medan itu, jadi butang itu akan jadi
    jalan buntu.
- [x] **Kad kecemasan kini objek 3D yang boleh diselak** (`emergency-card-view.tsx`).
  Muka depan membawa dua fakta yang mengubah tindakan klinisian: jenis darah dan alahan.
  Belakang membawa keadaan kesihatan, klinik/doktor, nota — dan **ruang untuk pautan NFC**
  yang dilukis sekarang supaya susun atur tak perlu berubah bila tag itu wujud. Ia
  menyatakan ia belum tersedia dan bukan menunjukkan kod palsu.
  - **CSS transform, bukan three.js.** Kad ialah dua muka rata dan satu putaran; konteks
    WebGL, graf adegan dan gelung render ialah jentera yang banyak untuk melukis segi
    empat, dan ia akan merampas teks itu daripada boleh dipilih dan daripada pembaca
    skrin. anime.js pun tak diperlukan: hanya selakan yang bermasa.
  - **Condongan menjejak penunjuk dan sengaja tak dianimasikan.** Condongan yang di-ease
    ketinggalan di belakang jari dan terasa rosak. `motion-reduce` menggugurkan kedua-dua.
  - Cetakan dapat **render rata tersendiri**: kad 3D memotong baris alahan pada dua baris
    dan hanya satu muka boleh dicetak. Orang yang mencetak ini sedang membuat salinan
    untuk beg tangan, jadi ia mesti lengkap.
- [x] **Pepijat: "kad kecemasan saya" menunjukkan kad saudara.** Butang itu menetapkan
  profil dipilih lalu menavigasi — kelihatan betul, bukan. `selectedProfileId` **menolak
  id yang tiada dalam snapshot yang dimuatkan dan jatuh balik ke profil lalai**, senyap.
  Kad kini menerima `profileId` secara eksplisit (`/emergency-card?profile=<id>`), jadi
  pratonton seseorang menamakan orang itu dan bukan bertanya keadaan global siapa yang
  sedang dipilih.
- [x] **Halaman Pelan (`/pricing`).** Dikaji daripada `aymanch-03/shadcn-pricing-page` —
  togol bulanan/tahunan dan peralihan harga `@number-flow/react` diambil daripadanya.
  Selebihnya dilabuhkan pada projek ini:
  - Pelan berbeza pada **had yang backend benar-benar kuatkuasakan** —
    `MAX_PROFILES_FREE`, `MAX_MEMBERS_FREE`, `MAX_UPLOAD_MB` — bukan matriks ciri rekaan.
    Yang berskala dalam produk ini bukan seat atau storan; ia berapa ramai yang kau jaga.
  - Lajur **Percuma dibaca daripada `/bootstrap` pada masa render**, bukan ditulis keras.
    Halaman harga yang bercanggah dengan had yang sebenarnya dikuatkuasakan pada akaun
    kau lebih teruk daripada tiada halaman harga.
  - Kad penggunaan menunjukkan profil kau berbanding had itu — perkara yang halaman harga
    biasanya tak boleh katakan, sebab ia menerangkan akaun hipotesis.
  - Tajuknya bertanya "Berapa ramai yang anda jaga?" dan bukan "Harga mudah dan telus",
    sebab itulah keputusan yang sebenarnya dibuat.
  - **Butang dilumpuhkan dengan sengaja.** Tiada integrasi pembayaran; butang yang
    membawa keputusan ke mana-mana lebih teruk daripada yang mengaku pelan itu belum
    dijual.
- [x] **`quota_exceeded` akhirnya dipetakan.** Backend memulangkannya sejak tier percuma
  dihantar dan tiada apa mengendalikannya, jadi mencapai had profil terbaca sebagai
  "Rekod bercanggah." — mesej yang tak menamakan sebab mahupun penyelesaian.
- [x] **Medan fail guna `ui/attachment`, bukan `<input type="file">` bergaya.**
  Komponen itu **sudah ada dalam projek** dan tak pernah digunakan di mana-mana — aku
  menggayakan input asli sedangkan ia duduk di situ.
  - Input asli kekal, tersembunyi: ia satu-satunya benda yang boleh membuka dialog fail.
    Semua yang kelihatan ialah komponen shadcn di atasnya.
  - Kawalan asli menunjukkan butang krom pelayar dan nama fail yang terpotong dari hujung
    yang salah, dan ia tak boleh menunjukkan apa yang app sebenarnya tahu: saiz berbanding
    kuota, jenis fail, sama ada muat naik masih berjalan. `Attachment` menerima `state`
    untuk kitaran itu.
  - Ditambah: seret-dan-lepas, dan butang buang yang **mengosongkan nilai input**. Tanpa
    itu, memilih semula fail yang sama selepas membuangnya tak mencetuskan `change` dan
    kelihatan rosak.
- [x] **Rekod sendiri kini boleh dikenali dan dicapai.** Dua kecacatan yang ditinggalkan
  bila rekod kesihatan sendiri dibina sebagai profil jagaan:
  - Penukar profil menyenaraikannya di bawah nama kau sendiri, **tak dapat dibezakan**
    daripada orang yang kau jaga. Kini berlencana "Saya" — menggunakan pembantu
    `isOwnHealthProfile` yang aku tambah dan tak pernah guna.
  - Tiada jalan daripada `/my-health` ke kad kecemasan sendiri: kau terpaksa cari diri
    sendiri dalam penukar itu dan tahu entri mana kau. Kini ada butang yang memilih
    profil itu dan terus ke kad.
- [x] **Kad kecemasan (`/emergency-card`).** Disusun untuk dibaca dalam tekanan, bukan
  dilayari: **alahan** dahulu dan paling besar dalam blok merah — ia satu-satunya medan
  yang mengubah tindakan klinisian dalam minit berikutnya — kemudian jenis darah dan
  tarikh lahir, semuanya satu skrin tanpa tab. Boleh dicetak dengan stylesheet yang sama.
  - Halaman **memberitahu pembaca bahawa bacaannya direkodkan**. Seseorang yang diberi
    akses kecemasan patut tahu penontonannya kelihatan kepada keluarga; backend mencatat
    `emergency_card_viewed` pada setiap bacaan.
- [x] **Teks pemadaman kini menyebut fail.** Sapuan storan objek backend (`worker.RunPurge`,
  2026-09-09) tiada permukaan UI — tiada respons API berubah — tetapi dua tempat teks
  sebelum ini senyap tentang apa yang berlaku kepada fail:
  - Padam dokumen: "Fail akan dibuang daripada profil ini" → menyatakan ia juga dipadam
    dari storan dan tindakan itu kekal.
  - Padam akaun: kini menyatakan dokumen dalam profil yang dipadam turut hilang, dan
    **mengapa** log jagaan untuk keluarga lain kekal — itu rekod mereka, bukan milik
    pengguna untuk dipadam. Teks lama membiarkan pengguna meneka.
- [x] **Tiga endpoint backend baharu kini ada UI.**
  - **Ringkasan doktor** (`/summaries`): pilih tempoh, ringkasan disediakan, dilihat dalam
    sheet bersekhen (ubat semasa, julat vital, temujanji, log). Lencana "Dijana AI" hanya
    muncul untuk `generator === "ai"` — ringkasan `assembled` tak mencipta apa-apa, jadi
    melabelnya akan membayangkan kaveat yang tak wujud. Mapper menganggap generator yang
    tak dikenali sebagai `ai`: lalai selamat ialah yang menunjukkan penafian.
  - **Sejarah** (tab baharu dalam profil jagaan): dipagar `can_change_roles` sama seperti
    endpointnya, dengan fallback yang **berkata** hanya pentadbir boleh lihat — panel kosong
    akan terbaca sebagai "tiada apa berlaku".
  - **Data & akaun** (tab baharu dalam Tetapan): muat turun data sendiri, dan padam akaun.
    Padam memerlukan kata laluan **dan** menaip PADAM — ini satu-satunya tindakan tanpa
    undo, dan medan kata laluan sahaja ialah gerak isyarat yang sama seperti menukar nama.
    409 `deletion_blocked` dipaparkan sebagai senarai profil dengan tindakan pembetulan
    setiap satu; sebab yang berbeza perlukan langkah yang berbeza.
  - Eksport dimuat turun melalui `Blob`, bukan `<a href>` terus ke endpoint: API perlukan
    header Authorization yang pautan biasa tak boleh hantar.
  - Repositori mock **menyusun** ringkasan daripada data mocknya sendiri, bukan pulang objek
    tin. Seluruh maksud ciri ini ialah ringkasan itu rekod kau sendiri disusun semula.
- [x] **Tinggi kawalan borang ialah satu skala, bukan 51 salinan.** `Input` asasnya 32px,
  jadi setiap borang menulis `h-11` sendiri dalam `className` — **51 tempat**. Kawalan yang
  *dikarang* dan bukan digaya terus tak dapat mesej itu: kesemua **13** `DatePicker` dalam
  app ialah medan 32px + butang kalendar 32px berdiri di sebelah kotak teks 44px.
  `components/ui/control-size.ts` kini memiliki skala itu (`default` 32px untuk krom padat,
  `xl` 44px untuk borang), dan `Input`, `SelectTrigger`, `InputGroup`, `DateField`,
  `TimeField`, `DateTimeField`, `DatePicker` dan `DateTimePicker` semuanya mengambilnya.
  Preseden yang sama sudah ditetapkan untuk `Button` (`size="xl"`) atas sebab yang sama.
  - `DatePicker` kini menyaiz butang kalendarnya daripada saiz medannya — itu yang
    memutuskan pasangan tak sepadan.
  - `InputGroupInput` kini `h-full`: dalam kumpulan, pembalut yang memiliki tinggi.
  - Sifar `h-11` tinggal di luar skala itu sendiri.
- [x] **Halaman "Kesihatan saya" (`/my-health`).** Jenis darah, tarikh lahir, alahan,
  keadaan kesihatan, klinik/doktor utama, nota kecemasan — untuk diri sendiri. Backend
  memodelkannya sebagai profil jagaan yang subjeknya diri sendiri, jadi frontend
  membandingkan `subject_user_id` dengan pengguna yang log masuk (`isOwnHealthProfile`).
  Boleh dicapai dari sidebar (Akaun → Kesihatan saya) dan menu akaun.
  - Satu butang simpan sahaja: `save()` mencipta rekod pada simpanan pertama dan mem-PATCH
    selepas itu. Dua laluan berbeza ialah sesuatu yang pengguna terpaksa faham tanpa sebab.
  - Medan kosong dihantar sebagai **kunci tiada**. Lajur ini di-COALESCE, jadi menghantar
    `""` untuk medan yang tak diisi akan memadam apa yang tersimpan.
- [x] **Footer sidebar ialah menu akaun, bukan butang log keluar.** Slot tempat setiap
  pengguna cari "siapa aku / ubah maklumat aku" memaparkan `Penjaga` di atas `KB` yang
  ditulis keras - dua-duanya bukan pengguna - dan menekannya melog keluar. Avatar header
  sama: `KB` dan `Penjaga`. Aplikasi tak pernah menunjukkan siapa yang log masuk, pada
  aplikasi di mana satu orang lazimnya pegang akaun untuk ibu bapa **dan** untuk diri
  sendiri. Kini kedua-duanya guna `components/account-menu.tsx` yang sama.
  - Footer tiada `tooltip`: ia membuatkan `SidebarMenuButton` membalut butang dengan
    `TooltipTrigger`, dan menyarangkannya dalam trigger menu meletakkan dua penyedia
    `ButtonContext` react-aria pada satu butang. Belum disahkan dalam pelayar.
- [x] **Medan yang backend pulangkan tetapi frontend buang, kini disambung.**
  `date_of_birth` (profil) dan `start_date`/`end_date`/`prescribed_by` (ubat) ditambah ke
  DTO backend awal sesi ini, tetapi mapper frontend masih menulis `""` ke atasnya dan
  borang masih dipagar `!apiMode`. Borang mengumpul data yang ia buang.
  - Tarikh kosong dihantar sebagai **kunci tiada**, bukan `""` - lajur ini di-COALESCE,
    jadi rentetan kosong akan memadam nilai tersimpan.
  - Backend: `createMedicationReq.start_date` dahulunya RFC3339 sedangkan responsnya
    `YYYY-MM-DD`. Borang yang membaca ubat dan menyimpannya semula ditolak atas datanya
    sendiri. Kini ISO dua-dua arah, dengan ujian round-trip.
- [x] **Sampul ralat 429 kini JSON.** `ratelimit` tak boleh import lapisan transport (kitaran
  import), jadi ia guna `http.Error` dan menjawab text/plain sedangkan semua ralat lain JSON.
  Klien gagal parse → jatuh ke "Ralat pelayan. Cuba lagi." - nasihat yang betul-betul
  bertentangan dengan apa yang had kadar itu minta. Sampul dipindah ke `internal/apierr`
  (pakej daun), kod `rate_limited` kini benar-benar dihantar.
- [x] **Keselamatan akaun (Modul 2 backend) kini ada UI.** Tab baharu "Keselamatan" dalam
  Tetapan: tukar kata laluan dan tukar e-mel, kedua-duanya berpagar kata laluan semasa.
  Tab "Sesi" kini menyenaraikan peranti yang log masuk (`GET /me/sessions`) dengan lencana
  "Peranti ini" dan butang tamatkan bagi yang lain.
  - 401 pada dua borang ini **tidak** boleh guna teks kongsi "Sila log masuk semula" - sesi
    pengguna elok, kata laluan dalam borang yang salah. Ia dipetakan ke ralat medan.
  - Backend memisahkan dua sebab 409 kepada kod `pending_invites` dan `email_taken`;
    satu kod `conflict` tak boleh diterjemah tepat.
  - Sesi semasa tiada butang "Tamatkan" - ia kelihatan seperti tindakan keselamatan
    sedangkan hasilnya cuma log keluar dari peranti di depan mata. Itu kerja butang
    "Log keluar" di bawahnya.
  - Repositori mock menguatkuasakan kata laluan seednya (`katalaluanlama`), jadi keadaan
    gagal boleh dilihat dalam mod demo.
  - `skipRefresh: true` pada dua borang ini: 401 di sini bermakna kata laluan dalam borang
    salah, bukan sesi luput. Tanpanya klien membelanjakan satu putaran refresh token pada
    setiap salah taip, dan pengguna yang refreshnya gagal dilog keluar kerana tersalah
    taip kata laluan sendiri.
- [x] Snapshot jagaan mati sepenuhnya apabila satu endpoint gagal - `Promise.all` dalam
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
  parameter - sekali gus menutup pelanggaran lapisan `application → composition`.
- [x] `bun.lock` tak sepadan `package.json`; setiap build Railway gagal pada
  `--frozen-lockfile`.
- [x] Proxy `/api/v1/*` boleh guna `API_INTERNAL_BASE_URL` (rangkaian private Railway).
  Nota: nilainya mesti `http://` dan berport `:8080` - rangkaian private tiada TLS.
- [x] Semua pemboleh ubah env yang dibaca kod kini didokumen dalam `.env`/`.env.example`
  _(`NEXT_PUBLIC_API_VERSION` dan `NEXT_PUBLIC_APP_PLATFORM` sebelum ini tiada dalam kedua-duanya)_

### Perlu disahkan, bukan dakwaan

- [ ] Navigasi client-side belum disahkan pada tahap klik - tiada pelayar dalam sesi itu.
  Semak DevTools → Network: satu fetch `?_rsc=` bermakna berjaya; permintaan dokumen penuh
  bermakna belum.
- [ ] `smoke:auth` masih melangkau langkah verify (lihat header skripnya). **Tidak lagi
  tersekat** — `POST /auth/resend-verification` wujud sejak 2026-09-09, jadi skrip itu
  kini boleh dilengkapkan.
- [ ] Saiz medan borang belum disahkan dengan mata. Setiap kawalan kini mengambil
  tingginya daripada `components/ui/control-size.ts`, tetapi itu disahkan pada tahap
  kompilasi sahaja. Buka satu borang dan sahkan medan teks, pemilih tarikh, butang
  kalendarnya dan `Select` semuanya sebaris.

---

## Modul dirancang (2026-09-09)

Belum dimulakan. Backend `TODO.md` §4 dan §5 memegang keputusan skema; di sini yang
dicatat ialah kerja frontend dan perkara yang UI mesti jangan buat.

### Bayi dan kanak-kanak: pertumbuhan, perkembangan, imunisasi

Rujukan reka bentuknya ialah **Buku Rekod Kesihatan Bayi dan Kanak-kanak KKM** yang ibu
bapa sudah bawa ke klinik. App ini patut boleh dikenali sebagai buku itu, bukan penjejak
generik — itu yang menjadikannya berguna pada hari pertama dan bukan satu lagi borang.

- [ ] **Carta pertumbuhan** — berat-ikut-umur, panjang/tinggi-ikut-umur, lilitan kepala,
  BMI-ikut-umur, dengan pita rujukan WHO di belakang titik kanak-kanak itu. `chart.tsx`
  sudah ada dalam `components/ui` dan carta trend vital sudah menggunakannya.
- [ ] **Ukuran ialah bacaan vital, bukan jadual baharu.** `weight` sudah wujud dalam
  `VITAL_TYPE_OPTIONS`; yang perlu ditambah ialah panjang/tinggi dan lilitan kepala.
  Nota klinikal yang mesti dihormati borang: bayi diukur **baring** (panjang) dan
  kanak-kanak **berdiri** (tinggi), dan WHO menganggapnya ukuran berbeza. Satu pilihan
  "tinggi" sahaja menghilangkan perbezaan itu.
- [ ] **Jangan beri diagnosis.** Skor-z di bawah −2 SD ada nama klinikal dalam dokumen
  WHO, dan meletakkan perkataan itu di sebelah bayi seseorang ialah diagnosis yang produk
  ini tak boleh buat — sekatan yang sama sudah dikenakan pada ringkasan AI. Plot titik
  terhadap pita dan biarkan pita bercakap. Apa-apa ayat lebih kuat daripada "di bawah
  julat rujukan — bincang dengan klinik" perlukan kelulusan klinisian.
- [ ] **Dua medan sedia ada jadi wajib, dan kedua-duanya belum sedia:**
  - **Tarikh lahir** — paksi-x carta ialah umur, jadi profil tanpa tarikh lahir tak boleh
    ada carta. UI mesti meminta dan menerangkannya, bukan merender carta kosong.
  - **Jantina** — rujukan WHO khusus jantina, jadi medan ini bertukar daripada label
    kepada kunci carian. `GENDER_OPTIONS` menyimpan rentetan paparan Melayu
    ("Lelaki"/"Perempuan"); ia perlu nilai berkod (`male`/`female`) dengan label
    dikenakan semasa render. Inilah kos gandingan yang ditandakan semasa select itu
    ditambah.
- [ ] **Umur terkoreksi untuk bayi pramatang** — bayi lahir 32 minggu diplot pada umur
  terkoreksi sehingga lebih kurang 2 tahun. Perlukan umur kandungan semasa lahir, yang
  tiada dalam mana-mana jadual lagi.
- [ ] **Jadual imunisasi kebangsaan** — dos, umur patut, tarikh diberi. Bentuknya dekat
  dengan ubat + peristiwa dos yang sudah ada.
- [ ] **Senarai semak perkembangan** ikut julat umur. Bahaya diagnosis sama seperti
  pertumbuhan, malah lebih tajam — "belum" pada satu pencapaian jauh lebih kerap variasi
  normal daripada penemuan.

### Pelan dan penggunaan

Halaman `/pricing` sudah menunjukkan penggunaan profil berbanding had, tetapi ia
mengiranya daripada senarai yang kebetulan dipegang oleh provider. Itu berjaya untuk satu
nombor dan takkan bertahan untuk yang kedua.

- [ ] Guna `GET /me/usage` sebaik ia wujud, dan buang pengiraan tempatan itu.
- [ ] **Amaran "hampir sampai had"** di tempat tindakan berlaku — butang cipta profil,
  borang jemput ahli — bukan hanya pada halaman harga. Pengguna yang melanggar had
  mendapati perkara itu pada saat mereka menekan simpan.
- [ ] Bila had berbeza mengikut akaun, lajur Percuma pada `/pricing` mesti terus membaca
  had **akaun ini**, bukan lalai pelan. Itu janji halaman itu.

## Audit aliran UX (2026-09-09)

Diukur dari kod, bukan diandaikan. Borang itu sendiri elok - tarikh/masa memang
diisi lalai dengan masa sekarang, dan borang vital adaptif (sistolik/diastolik
hanya untuk tekanan darah, unit auto-set dari jenis). Geserannya **antara**
borang: cara pengguna tiba, dan apa berlaku selepas simpan.

### Menyekat pada telefon

- [ ] **Switcher profil desktop sahaja, tapi semua borang bergantung padanya.**
  `app-header.tsx:55` ialah satu-satunya `ProfileSwitcher` dalam kod, dan ia
  `hidden sm:flex`. Sidebar tak menunjukkan profil terpilih. Jadi pada telefon
  kelima-lima borang render penuh, butang hantar `isDisabled` senyap, dan teks
  bantuannya berkata "Pilih profil jagaan di header dahulu" - kawalan yang tiada
  pada saiz skrin itu. Ini aplikasi yang digunakan di sisi katil.
  Perlu: switcher dalam sidebar (ada pada semua saiz), dan borang patut tunjuk
  `Empty` + "Pilih profil" daripada merender medan yang tak boleh dihantar.

### Dashboard tak boleh diklik

- [ ] **Sifar elemen interaktif.** `grep -cE "href=|onPress=|Button"` pada
  `dashboard-page.tsx` = 0. Jubin statistik dan dua carta, tiada satu pautan.
  `buildDashboardStats` mengira `openTaskCount` dan `upcomingAppointmentCount` -
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
  projek ini - ia cipta ubat *dan* jadual pertamanya dalam satu hantar, kemudian
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

### `care-profile-field-gaps.ts` — DIBETULKAN 2026-09-09

- [x] Fail itu menyenaraikan jurang sebagai `relation`, `dateOfBirth`, `notes`. **Dua
  daripada tiga nama itu tiada dalam jadual** `care_profiles`, jadi ia menyembunyikan
  medan yang salah dan memberi gambaran jurang itu kecil. Sembilan lajur yang benar-benar
  ada (`legal_name`, `date_of_birth`, `gender`, `blood_type`, `allergy_summary`,
  `condition_summary`, `primary_clinic`, `primary_doctor`, `emergency_note`) kini
  didedahkan oleh backend dan dibaca oleh mapper. Senarai jurang tinggal `relation` dan
  `notes` — dua-duanya **tiada lajur di mana-mana**, jadi ia perlu migrasi, bukan
  perubahan DTO.

### Borang profil jagaan: lapan medan kesihatan masih belum dikumpul

Sekatan DTO sudah hilang — `createProfileReq`/`updateProfileReq` menerima kesembilan-sembilan
medan sejak 2026-09-09, dan borang sudah menghantar `date_of_birth`.

- [ ] Borang cipta/sunting **profil jagaan** masih hanya mengumpul nama dan tarikh lahir.
  Lapan lagi (`legal_name`, `gender`, `blood_type`, `allergy_summary`,
  `condition_summary`, `primary_clinic`, `primary_doctor`, `emergency_note`) sudah boleh
  disimpan tetapi tiada medan untuk mengisinya. Halaman `/my-health` sudah mengumpul
  kesemuanya untuk rekod sendiri — bahagian itu boleh diguna semula sebagai rujukan,
  atau dikongsi sebagai satu komponen.
  Nota: hantar medan kosong sebagai **kunci tiada**, bukan `""` — lajur ini di-COALESCE.

### Kad kecemasan — SELESAI 2026-09-09

- [x] `GET /care-profiles/{id}/emergency-card` dibina, dan halaman `/emergency-card`
  menyambungnya. Keputusan bentuk yang tertangguh itu rupanya **sudah ditentukan oleh
  kod**: `GetProfile` memerlukan `can_view_timeline` sedangkan `emergency_viewer` hanya
  ada `can_view_emergency_card`, jadi "paparan atas DTO profil" mustahil tanpa
  melonggarkan bacaan profil untuk peranan paling sempit dalam sistem.

### Modul kesihatan diri sendiri — SELESAI 2026-09-09

Dibina sebagai profil jagaan yang subjeknya diri sendiri (pilihan pertama di bawah
menang): `GET/POST /me/health-profile` + halaman `/my-health`.

Keputusan yang diambil: rekod sendiri ialah profil jagaan yang subjeknya diri sendiri,
bukan lajur baharu pada `users` — jadi ubat, vital, dokumen dan model keizinan berfungsi
padanya tanpa kerja tambahan. `/me` kekal empat medan (id, e-mel, nama paparan, status
pengesahan); ia identiti log masuk, bukan rekod klinikal.

- [ ] **`tinggi` (dan berat) masih tiada** dalam mana-mana jadual — satu-satunya medan
  dalam nota asal yang masih perlukan migrasi. Putuskan kedua-duanya sekali gus supaya
  tidak bermigrasi dua kali.

