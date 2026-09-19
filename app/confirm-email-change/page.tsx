import Link from "next/link"
import type { Metadata } from "next"

import { ConfirmEmailChangeForm } from "@/components/auth/confirm-email-change-form"
import { AuthShell } from "@/components/auth/auth-shell"

export const metadata: Metadata = {
  title: "Sahkan e-mel baharu",
  description: "Sahkan alamat e-mel baharu akaun Kasih Bersama anda.",
}

export default async function ConfirmEmailChangePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const params = await searchParams

  return (
    <AuthShell
      panelKicker="Alamat baharu."
      panelTitle="Sahkan e-mel baharu anda."
      panelBody="Sahkan alamat baharu supaya akaun anda kekal selamat dan pemberitahuan sampai."
    >
      <header className="space-y-3">
        <p className="text-sm font-medium text-primary">Tukar e-mel</p>
        <h1 className="font-heading text-2xl tracking-tight text-balance sm:text-3xl lg:text-4xl">
          Sahkan e-mel baharu anda.
        </h1>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
          Buka pautan ini terus dari peti masuk anda untuk melengkapkan
          pertukaran alamat.
        </p>
      </header>

      <ConfirmEmailChangeForm token={params.token} />

      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link
          href="/"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Kembali ke log masuk
        </Link>
      </p>
    </AuthShell>
  )
}
