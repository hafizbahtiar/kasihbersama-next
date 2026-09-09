import Link from "next/link"

export function PrivacyArticle() {
  return (
    <article className="space-y-8 text-sm leading-7 text-muted-foreground">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl tracking-tight text-foreground">
          Dasar privasi
        </h1>
        <p>Kemas kini terakhir: 9 September 2026</p>
      </header>

      <p>
        Kasih Bersama menyimpan rekod jagaan keluarga. Dasar ini menerangkan data
        yang kami pegang, siapa yang boleh membacanya, dan bagaimana anda
        mengawalnya dari dalam aplikasi.
      </p>

      <section className="space-y-3">
        <h2 className="font-heading text-xl tracking-tight text-foreground">
          Apa yang kami simpan
        </h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="text-foreground">Akaun:</span> e-mel, nama paparan,
            dan kata laluan (argon2id, bukan teks biasa).
          </li>
          <li>
            <span className="text-foreground">Rekod jagaan:</span> log, ubat,
            temujanji, tugasan, bacaan vital, dan nota kesihatan pada profil
            jagaan - bukan pada akaun yang menciptanya.
          </li>
          <li>
            <span className="text-foreground">Dokumen:</span> fail yang anda
            muat naik ke profil, disimpan dalam bucket peribadi.
          </li>
          <li>
            <span className="text-foreground">Peranti:</span> token push jika
            anda membenarkan peringatan.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl tracking-tight text-foreground">
          Siapa yang boleh membaca
        </h2>
        <p>
          Setiap permintaan disemak semula terhadap profil itu. Role dan
          kebenaran tidak dibawa dalam token log masuk. Ahli yang anda jemput
          hanya nampak apa yang role mereka benarkan. Kad kecemasan ialah
          pandangan sempit untuk orang di luar keluarga, dan bacaan itu
          direkodkan.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl tracking-tight text-foreground">
          Hak anda dalam aplikasi
        </h2>
        <p>
          Dari Tetapan anda boleh muat turun data akaun anda, padam akaun,
          tukar e-mel atau kata laluan, dan tamatkan sesi. Eksport tidak
          mengandungi rekod jagaan keluarga lain - itu milik mereka.
        </p>
        <p>
          Padam akaun menyahnamakan identiti anda. Profil yang hanya anda
          ahlinya turut dipadam, termasuk dokumen. Profil yang masih ada ahli
          lain kekal, kerana rekod itu milik keluarga, bukan akaun yang
          keluar.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl tracking-tight text-foreground">
          Pihak ketiga
        </h2>
        <p>
          Kami menggunakan Resend (e-mel), Cloudflare R2 (dokumen), Railway
          (pangkalan data dan API), dan OneSignal (push). Kami tidak menjual
          data peribadi.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl tracking-tight text-foreground">
          Kanak-kanak dan subjek jagaan
        </h2>
        <p>
          Subjek profil - kanak-kanak atau warga emas - mungkin bukan pemegang
          akaun. Data mereka dimasukkan oleh penjaga, bukan dikumpul terus
          daripada mereka.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl tracking-tight text-foreground">
          Hubungi
        </h2>
        <p>
          Pertanyaan privasi:{" "}
          <a
            href="mailto:hafiz@hafizbahtiar.com"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            hafiz@hafizbahtiar.com
          </a>
          .{" "}
          <Link
            href="/terms"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Terma penggunaan
          </Link>
          .
        </p>
      </section>
    </article>
  )
}
