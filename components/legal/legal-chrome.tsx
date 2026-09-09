"use client"

import Link from "next/link"
import type { ReactNode } from "react"

import { useAuth } from "@/components/auth/auth-provider"
import { LogoMark } from "@/components/brand/logo-mark"

export function LegalChrome({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const signedIn = status === "authenticated"
  const backHref = signedIn ? "/settings" : "/"
  const backLabel = signedIn ? "Kembali ke tetapan" : "Kembali ke log masuk"

  return (
    <main className="min-h-dvh bg-background">
      <header className="border-b border-foreground/10">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href={backHref} className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 p-1.5">
              <LogoMark className="size-full" decorative />
            </span>
            <span className="truncate text-sm font-medium">Kasih Bersama</span>
          </Link>
          <Link
            href={backHref}
            className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {backLabel}
          </Link>
        </div>
      </header>
      <div className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-8 sm:py-14">
        {children}
      </div>
    </main>
  )
}
