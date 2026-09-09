import Link from "next/link"
import type { Metadata } from "next"

import { VerifyEmailForm } from "@/components/auth/verify-email-form"
import { AuthShell } from "@/components/auth/auth-shell"

export const metadata: Metadata = {
  title: "Sahkan e-mel",
  description: "Sahkan alamat e-mel akaun Kasih Bersama anda.",
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const params = await searchParams
  const token = params.token

  return (
    <AuthShell
      panelKicker="Hampir siap."
      panelTitle="Sahkan e-mel anda."
      panelBody="Pengesahan e-mel membantu melindungi akaun dan memastikan pemberitahuan sampai."
    >
      <header className="space-y-3">
        <p className="text-sm font-medium text-primary">Pengesahan</p>
        <h1 className="font-heading text-2xl tracking-tight text-balance sm:text-3xl lg:text-4xl">
          Sahkan e-mel anda.
        </h1>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
          Tampal token dari e-mel pengesahan, atau buka pautan terus dari peti
          masuk.
        </p>
      </header>

      <VerifyEmailForm initialToken={token} />

      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link
          href="/home"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Langkau buat masa ini
        </Link>
      </p>
    </AuthShell>
  )
}
