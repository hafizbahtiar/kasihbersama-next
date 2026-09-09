import Link from "next/link"
import type { Metadata } from "next"

import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { AuthShell } from "@/components/auth/auth-shell"

export const metadata: Metadata = {
  title: "Set semula kata laluan",
  description: "Cipta kata laluan baharu untuk akaun Kasih Bersama anda.",
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const params = await searchParams
  const token = params.token ?? ""

  return (
    <AuthShell
      panelKicker="Kata laluan baharu."
      panelTitle="Set semula dengan selamat."
      panelBody="Pilih kata laluan baharu yang kuat untuk melindungi akaun anda."
    >
      <header className="space-y-3">
        <p className="text-sm font-medium text-primary">Set semula</p>
        <h1 className="font-heading text-2xl tracking-tight text-balance sm:text-3xl lg:text-4xl">
          Cipta kata laluan baharu.
        </h1>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
          Kata laluan mesti sekurang-kurangnya 10 aksara.
        </p>
      </header>

      <ResetPasswordForm initialToken={token} />

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
