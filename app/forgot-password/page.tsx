import Link from "next/link"
import type { Metadata } from "next"

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { AuthShell } from "@/components/auth/auth-shell"

export const metadata: Metadata = {
  title: "Lupa kata laluan",
  description: "Set semula kata laluan akaun Kasih Bersama anda.",
}

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      panelKicker="Kami bantu anda kembali."
      panelTitle="Set semula dengan tenang."
      panelBody="Masukkan e-mel akaun anda. Kami akan hantar pautan untuk cipta kata laluan baharu."
    >
      <header className="space-y-3">
        <p className="text-sm font-medium text-primary">Pemulihan akaun</p>
        <h1 className="font-heading text-2xl tracking-tight text-balance sm:text-3xl lg:text-4xl">
          Lupa kata laluan?
        </h1>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
          Masukkan e-mel yang digunakan untuk akaun anda. Kami akan hantar
          pautan set semula.
        </p>
      </header>

      <ForgotPasswordForm />

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Ingat kata laluan?{" "}
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
