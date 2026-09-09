"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { LinkButton } from "@/components/ui/button"
import type { ReactNode } from "react"

export function EmailVerifiedGate({
  children,
  fallback,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  const { user, status } = useAuth()

  if (status === "loading") {
    return null
  }

  if (user && !user.emailVerified) {
    return (
      fallback ?? (
        <div className="rounded-xl border bg-card p-4 text-sm">
          <p className="font-medium">Sahkan e-mel dahulu</p>
          <p className="mt-1 text-muted-foreground">
            Tindakan ini memerlukan e-mel akaun anda disahkan.
          </p>
          <LinkButton href="/verify-email" className="mt-4">
            Sahkan e-mel
          </LinkButton>
        </div>
      )
    )
  }

  return children
}

export function useEmailVerified() {
  const { user } = useAuth()
  return Boolean(user?.emailVerified)
}
