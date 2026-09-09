"use client"

import { useState } from "react"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"

/**
 * Requests a fresh verification email.
 *
 * The settings card used to link to /verify-email, which asks for a token the
 * user does not have - the only verification email an account ever received
 * was sent at signup, and it expires in 24 hours. Anyone past that window had
 * nowhere to go. This is the send.
 */
export function ResendVerificationButton({
  className,
  children = "Hantar e-mel pengesahan",
}: {
  className?: string
  children?: React.ReactNode
}) {
  const { resendVerification } = useAuth()
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function onPress() {
    setIsSending(true)
    try {
      const ok = await resendVerification()
      if (ok) {
        setSent(true)
      }
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className={className}>
      <Button onPress={onPress} isDisabled={isSending} size="xl">
        {isSending ? "Menghantar…" : sent ? "Hantar sekali lagi" : children}
      </Button>
      {sent ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Pautan dihantar. Ia sah selama 24 jam — semak folder spam jika tiada
          dalam peti masuk.
        </p>
      ) : null}
    </div>
  )
}
