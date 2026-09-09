"use client"

import { useState } from "react"
import type { VariantProps } from "class-variance-authority"
import { IconMailCheck } from "@tabler/icons-react"

import { useAuth } from "@/components/auth/auth-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"

/**
 * Requests a fresh verification email.
 *
 * The settings card used to link to /verify-email, which asks for a token the
 * user does not have - the only verification email an account ever received
 * was sent at signup, and it expires in 24 hours. Anyone past that window had
 * nowhere to go. This is the send.
 *
 * `size` is a prop, not a constant. It was hardcoded to xl for the auth form,
 * which made the button stand a head taller than the "Saya ada token" link
 * beside it in the settings card. A shared control cannot pick a size that
 * only suits one of the places it appears; the caller knows its own row.
 */
export function ResendVerificationButton({
  className,
  size = "default",
  children = "Hantar e-mel pengesahan",
}: {
  className?: string
  size?: VariantProps<typeof buttonVariants>["size"]
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
      <Button onPress={onPress} isDisabled={isSending} size={size}>
        {isSending ? "Menghantar…" : sent ? "Hantar sekali lagi" : children}
      </Button>
      {sent ? (
        <Alert className="mt-3">
          <IconMailCheck />
          <AlertTitle>Pautan dihantar</AlertTitle>
          <AlertDescription>
            Sah selama 24 jam. Semak folder spam jika tiada dalam peti masuk.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
