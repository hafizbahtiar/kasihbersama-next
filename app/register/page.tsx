import Link from "next/link"
import type { Metadata } from "next"

import { RegisterForm } from "@/components/auth/register-form"
import { AuthShell } from "@/components/auth/auth-shell"
import { GoogleMark } from "@/components/auth/google-mark"
import { Button } from "@/components/ui/button"
import { FieldSeparator } from "@/components/ui/field"

export const metadata: Metadata = {
  title: "Daftar",
  description: "Cipta akaun Kasih Bersama untuk mula menjaga bersama keluarga.",
}

export default function RegisterPage() {
  return (
    <AuthShell
      panelKicker="Mulakan dengan satu akaun keluarga."
      panelTitle="Sertai ruang penjagaan bersama."
      panelBody="Daftar untuk urus rutin, kesihatan dan komunikasi keluarga dalam satu tempat."
    >
      <header className="space-y-3">
        <p className="text-sm font-medium text-primary">Akaun baharu</p>
        <h1 className="font-heading text-2xl tracking-tight text-balance sm:text-3xl lg:text-4xl">
          Daftar ke Kasih Bersama.
        </h1>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
          Isi maklumat anda untuk mula menjaga bersama keluarga.
        </p>
      </header>

      <RegisterForm />

      <FieldSeparator className="my-6">atau teruskan dengan</FieldSeparator>

      <Button
        type="button"
        variant="outline"
        size="xl"
        className="w-full"
        isDisabled
      >
        <GoogleMark />
        Google (tidak tersedia)
      </Button>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Sudah ada akaun?{" "}
        <Link
          href="/"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Log masuk
        </Link>
      </p>
    </AuthShell>
  )
}
