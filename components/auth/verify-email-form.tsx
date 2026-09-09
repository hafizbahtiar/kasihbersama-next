"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { IconAlertTriangle, IconMailCheck } from "@tabler/icons-react"

import { useClearAuthErrorOnMount } from "@/hooks/use-clear-auth-error-on-mount"
import { AuthErrorBanner } from "@/components/care/async-state"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ResendVerificationButton } from "@/components/auth/resend-verification-button"

export function VerifyEmailForm({ initialToken }: { initialToken?: string }) {
  const router = useRouter()
  const { verifyEmail, error, clearError, user } = useAuth()
  useClearAuthErrorOnMount()
  const [token, setToken] = useState(initialToken ?? "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const autoSubmitted = useRef(false)

  useEffect(() => {
    const trimmed = initialToken?.trim()
    if (
      !trimmed ||
      autoSubmitted.current ||
      user?.emailVerified ||
      submitted ||
      isSubmitting
    ) {
      return
    }
    autoSubmitted.current = true
    setIsSubmitting(true)
    clearError()
    void verifyEmail(trimmed)
      .then((ok) => {
        if (ok) {
          setSubmitted(true)
        }
      })
      .finally(() => setIsSubmitting(false))
  }, [
    clearError,
    initialToken,
    isSubmitting,
    user?.emailVerified,
    submitted,
    verifyEmail,
  ])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token.trim()) {
      return
    }
    setIsSubmitting(true)
    clearError()
    try {
      const ok = await verifyEmail(token.trim())
      if (ok) {
        setSubmitted(true)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // POST /auth/verify-email is token-based and unauthenticated: it verifies
  // whoever the token belongs to, which is not necessarily whoever is signed
  // in. Reporting success on the call alone claimed "your email is verified"
  // for a token issued to another account, while settings read /me and
  // correctly said otherwise. Trust /me, not the 204.
  const verifiedAnotherAccount =
    submitted && user != null && !user.emailVerified

  if (verifiedAnotherAccount) {
    return (
      <div className="mt-8 space-y-4">
        <Alert>
          <IconAlertTriangle />
          <AlertTitle>Token itu milik akaun lain</AlertTitle>
          <AlertDescription>
            Pautan tersebut mengesahkan akaun berbeza daripada yang sedang log
            masuk ({user.email}). Minta pautan baharu untuk akaun ini.
          </AlertDescription>
        </Alert>
        <ResendVerificationButton size="xl" className="w-full" />
      </div>
    )
  }

  if (user?.emailVerified || submitted) {
    return (
      <div className="mt-8 space-y-4">
        <Alert>
          <IconMailCheck />
          <AlertTitle>E-mel disahkan</AlertTitle>
          <AlertDescription>
            {user
              ? "Anda boleh teruskan ke ruang jagaan."
              : "Log masuk untuk teruskan."}
          </AlertDescription>
        </Alert>
        <Button
          size="xl"
          className="w-full"
          onPress={() => router.push(user ? "/home" : "/")}
        >
          {user ? "Pergi ke laman utama" : "Log masuk"}
        </Button>
      </div>
    )
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={onSubmit}>
      <AuthErrorBanner error={error} onDismiss={clearError} />
      {initialToken && isSubmitting ? (
        <p className="text-sm text-muted-foreground">Mengesahkan token...</p>
      ) : null}
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="token">Token pengesahan</FieldLabel>
          <Input
            id="token"
            name="token"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Tampal token dari e-mel"
            required
            size="xl"
            className="bg-background"
          />
        </Field>

        <Button
          type="submit"
          size="xl"
          className="w-full"
          isDisabled={isSubmitting}
        >
          {isSubmitting ? "Mengesahkan..." : "Sahkan e-mel"}
        </Button>
      </FieldGroup>

      {user ? (
        <div className="border-t pt-6">
          <p className="mb-3 text-sm text-muted-foreground">
            Tiada e-mel, atau pautan sudah tamat tempoh?
          </p>
          <ResendVerificationButton
            size="xl"
            variant="outline"
            className="w-full"
          />
        </div>
      ) : null}
    </form>
  )
}
