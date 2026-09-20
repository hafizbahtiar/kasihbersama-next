"use client"

import Link from "next/link"
import { useState, type FormEvent } from "react"
import { useSearchParams } from "next/navigation"

import { useClearAuthErrorOnMount } from "@/hooks/use-clear-auth-error-on-mount"
import { AuthErrorBanner } from "@/components/shared/async-state"
import { useAuth } from "@/components/auth/auth-provider"
import { PasswordField } from "@/components/auth/password-field"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

const MFA_CODE_LENGTH = 6

function safeRedirectPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return undefined
  }
  return next
}

export function LoginForm() {
  const searchParams = useSearchParams()
  const { login, verifyMfa, error, clearError } = useAuth()
  useClearAuthErrorOnMount()
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Set once the password checks out and a second factor is required. Its
  // presence is what puts the form in the code-entry step.
  const [challengeToken, setChallengeToken] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const redirectTo = safeRedirectPath(searchParams.get("next"))

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get("email") ?? "")
    const password = String(form.get("password") ?? "")
    setIsSubmitting(true)
    clearError()
    try {
      const outcome = await login({ email, password }, redirectTo)
      if (outcome?.status === "mfaRequired") {
        setChallengeToken(outcome.challengeToken)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function onVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!challengeToken || code.length !== MFA_CODE_LENGTH) {
      return
    }
    setIsSubmitting(true)
    clearError()
    try {
      await verifyMfa({ challengeToken, code }, redirectTo)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (challengeToken) {
    return (
      <form className="mt-8 space-y-4" onSubmit={onVerify}>
        <AuthErrorBanner error={error} onDismiss={clearError} />
        <p className="text-sm leading-6 text-muted-foreground">
          Akaun ini dilindungi pengesahan dua faktor. Masukkan kod 6 digit
          daripada aplikasi authenticator anda.
        </p>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="mfa-code">Kod pengesahan</FieldLabel>
            <InputOTP
              id="mfa-code"
              maxLength={MFA_CODE_LENGTH}
              value={code}
              onChange={setCode}
              autoFocus
              inputMode="numeric"
            >
              <InputOTPGroup>
                {Array.from({ length: MFA_CODE_LENGTH }, (_, index) => (
                  <InputOTPSlot key={index} index={index} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </Field>

          <Button
            type="submit"
            size="xl"
            className="w-full"
            isDisabled={isSubmitting || code.length !== MFA_CODE_LENGTH}
          >
            {isSubmitting ? "Mengesahkan..." : "Sahkan"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="xl"
            className="w-full"
            isDisabled={isSubmitting}
            onPress={() => {
              setChallengeToken(null)
              setCode("")
              clearError()
            }}
          >
            Kembali
          </Button>
        </FieldGroup>
      </form>
    )
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={onSubmit}>
      <AuthErrorBanner error={error} onDismiss={clearError} />
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">E-mel</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="nama@contoh.com"
            autoComplete="email"
            inputMode="email"
            required
            size="xl"
            className="bg-background"
          />
        </Field>

        <Field>
          <div className="flex items-center justify-between gap-2">
            <FieldLabel htmlFor="password">Kata laluan</FieldLabel>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Lupa kata laluan?
            </Link>
          </div>
          <PasswordField
            id="password"
            name="password"
            autoComplete="current-password"
          />
        </Field>

        <Field orientation="horizontal" className="items-center">
          <Checkbox id="remember" name="remember" />
          <FieldLabel
            htmlFor="remember"
            className="font-normal text-muted-foreground"
          >
            Ingat saya pada peranti ini
          </FieldLabel>
        </Field>

        <Button
          type="submit"
          size="xl"
          className="w-full"
          isDisabled={isSubmitting}
        >
          {isSubmitting ? "Log masuk..." : "Log masuk"}
        </Button>
      </FieldGroup>
    </form>
  )
}
