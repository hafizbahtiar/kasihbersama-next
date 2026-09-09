"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

import { useAuth } from "@/components/auth/auth-provider"
import { PageLoadingState } from "@/components/care/page-loading-state"

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status !== "unauthenticated") {
      return
    }
    const next =
      pathname && pathname !== "/" ? `/?next=${encodeURIComponent(pathname)}` : "/"
    router.replace(next)
  }, [pathname, router, status])

  if (status === "loading") {
    return <PageLoadingState label="Memuatkan sesi…" />
  }

  if (status === "unauthenticated") {
    return <PageLoadingState label="Mengalihkan ke log masuk…" />
  }

  return children
}
