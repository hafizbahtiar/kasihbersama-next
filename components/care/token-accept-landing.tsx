"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import {
  appPathForTokenKind,
  captureTokenFromUrl,
  type TokenAcceptKind,
} from "@/lib/application/deep-links"
import { isMockDataEnabled } from "@/lib/infrastructure/config"

export function TokenAcceptLanding({ kind }: { kind: TokenAcceptKind }) {
  const router = useRouter()

  useEffect(() => {
    captureTokenFromUrl(kind)
    const target = appPathForTokenKind(kind)

    if (isMockDataEnabled()) {
      router.replace(target)
      return
    }

    router.replace(`/?next=${encodeURIComponent(target)}`)
  }, [kind, router])

  return (
    <div className="grid min-h-dvh place-items-center p-6 text-sm text-muted-foreground">
      Menyediakan pautan {kind === "invite" ? "jemputan" : "tuntutan"}…
    </div>
  )
}
