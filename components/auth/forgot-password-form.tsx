"use client"

import { useState, type FormEvent } from "react"

import { useClearAuthErrorOnMount } from "@/hooks/use-clear-auth-error-on-mount"
import { AuthErrorBanner } from "@/components/care/async-state"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function ForgotPasswordForm() {
  const { forgotPassword, error, clearError } = useAuth()
  useClearAuthErrorOnMount()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get("email") ?? "")
    setIsSubmitting(true)
    clearError()
    try {
      const ok = await forgotPassword(email)
      if (ok) {
        setSent(true)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="mt-8 rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        Semak peti masuk anda. Jika e-mel wujud, pautan set semula akan dihantar
        sebentar lagi.
      </div>
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

        <Button
          type="submit"
          size="xl"
          className="w-full"
          isDisabled={isSubmitting}
        >
          {isSubmitting ? "Menghantar..." : "Hantar pautan set semula"}
        </Button>
      </FieldGroup>
    </form>
  )
}
