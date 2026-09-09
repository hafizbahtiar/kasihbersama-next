"use client"

import { useState } from "react"
import type { VariantProps } from "class-variance-authority"

import { useAuth } from "@/components/auth/auth-provider"
import { Button, buttonVariants } from "@/components/ui/button"

/**
 * Requests a fresh verification email.
 *
 * The settings card used to link to /verify-email, which asks for a token the
 * user does not have - the only verification email an account ever received
 * was sent at signup, and it expires in 24 hours. Anyone past that window had
 * nowhere to go. This is the send.
 *
 * Renders a button and nothing else. It briefly also rendered an Alert with
 * the result, which landed inside the settings card's right-aligned footer -
 * a row sized for buttons - and stretched it. The confirmation was duplicate
 * anyway: resendVerification already raises a toast. A control dropped into
 * someone else's layout gets to be one element.
 *
 * No wrapper element either, so it stays a real sibling in a flex row and
 * inherits the row's gap and alignment instead of nesting away from them.
 *
 * `size` is a prop, not a constant. It was hardcoded to xl for the auth form,
 * which made the button stand a head taller than the "Saya ada token" link
 * beside it. A shared control cannot pick a size that suits only one of the
 * places it appears; the caller knows its own row.
 */
export function ResendVerificationButton({
  className,
  size = "default",
  variant,
  children = "Hantar e-mel pengesahan",
}: {
  className?: string
  size?: VariantProps<typeof buttonVariants>["size"]
  variant?: VariantProps<typeof buttonVariants>["variant"]
  children?: React.ReactNode
}) {
  const { resendVerification } = useAuth()
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function onPress() {
    setIsSending(true)
    try {
      if (await resendVerification()) {
        setSent(true)
      }
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Button
      onPress={onPress}
      isDisabled={isSending}
      size={size}
      variant={variant}
      className={className}
    >
      {isSending ? "Menghantar…" : sent ? "Hantar sekali lagi" : children}
    </Button>
  )
}
