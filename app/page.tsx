import { Suspense } from "react"
import Link from "next/link"
import type { Metadata } from "next"

import { LoginForm } from "@/components/auth/login-form"
import { AuthShell } from "@/components/auth/auth-shell"
import { GoogleMark } from "@/components/auth/google-mark"
import { Button } from "@/components/ui/button"
import { FieldSeparator } from "@/components/ui/field"

export const metadata: Metadata = {
  title: "Log masuk",
  description:
    "Log masuk ke Kasih Bersama untuk teruskan penjagaan bersama keluarga.",
}

export default function Page() {
  return (
    <AuthShell>
      <header className="space-y-3">
        <p className="text-sm font-medium text-primary">Selamat kembali</p>
        <h1 className="font-heading text-2xl tracking-tight text-balance sm:text-3xl lg:text-4xl">
          Log masuk ke ruang anda.
        </h1>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
          Masukkan maklumat anda untuk teruskan penjagaan bersama keluarga.
        </p>
      </header>

      {/* LoginForm reads ?next= via useSearchParams, which opts the subtree
          into client-side rendering; without this boundary the whole page
          bails out of prerendering. */}
      <Suspense fallback={<div className="mt-8 h-64" aria-hidden />}>
        <LoginForm />
      </Suspense>

      <FieldSeparator className="my-6">atau teruskan dengan</FieldSeparator>

      <Button
        type="button"
        variant="outline"
        className="h-11 min-h-11 w-full"
        isDisabled
      >
        <GoogleMark />
        Google (tidak tersedia)
      </Button>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Belum ada akaun?{" "}
        <Link
          href="/register"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Daftar sekarang
        </Link>
      </p>
    </AuthShell>
  )
}
