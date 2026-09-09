import Link from "next/link"

export function TermsArticle() {
  return (
    <article className="space-y-8 text-sm leading-7 text-muted-foreground">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl tracking-tight text-foreground">
          Terma penggunaan
        </h1>
        <p>Kemas kini terakhir: 9 September 2026</p>
      </header>

      <p>
        Dengan mendaftar atau menggunakan Kasih Bersama, anda bersetuju dengan
        terma ini. Jika tidak, jangan guna perkhidmatan ini.
      </p>

      <section className="space-y-3">
        <h2 className="font-heading text-xl tracking-tight text-foreground">
          Apa ini, dan apa bukan
        </h2>
        <p>
          Kasih Bersama ialah alat penyelarasan jagaan keluarga: log, ubat,
          temujanji, dan dokumen dalam satu tempat.
        </p>
        <p className="text-foreground">
          Ia bukan alat perubatan. Ia tidak mendiagnosis, merawat, atau
          mengganti nasihat kecemasan. Keputusan perubatan kekal dengan klinik
          anda.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl tracking-tight text-foreground">
          Akaun
        </h2>
        <p>
          Anda mesti berusia 18 tahun ke atas untuk mendaftar. Tiada had umur
          bagi subjek profil jagaan - profil bagi pihak mereka diuruskan oleh
          penjaga yang memegang akaun.
        </p>
        <p>
          Jaga kata laluan anda. Beritahu kami jika akaun dibuka tanpa
          kebenaran. Jangan cuba akses profil yang anda tidak dijemput
          kepadanya.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl tracking-tight text-foreground">
          Data anda
        </h2>
        <p>
          Rekod jagaan yang anda masukkan kekal milik keluarga. Kami
          memprosesnya hanya untuk menyediakan perkhidmatan. Lihat{" "}
          <Link
            href="/privacy"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            dasar privasi
          </Link>{" "}
          untuk hak eksport dan padam.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl tracking-tight text-foreground">
          Undang-undang
        </h2>
        <p>
          Perkhidmatan disediakan seadanya. Terma ini ditadbir oleh
          undang-undang Malaysia. Pertanyaan:{" "}
          <a
            href="mailto:hafiz@hafizbahtiar.com"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            hafiz@hafizbahtiar.com
          </a>
          .
        </p>
      </section>
    </article>
  )
}
