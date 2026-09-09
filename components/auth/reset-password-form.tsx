"use client"

import { useState, type FormEvent } from "react"

import { useClearAuthErrorOnMount } from "@/hooks/use-clear-auth-error-on-mount"
import { useBrowserValue } from "@/hooks/use-browser-value"
import { useHydrated } from "@/hooks/use-hydrated"
import { AuthErrorBanner } from "@/components/care/async-state"
import { useAuth } from "@/components/auth/auth-provider"
import { PasswordField } from "@/components/auth/password-field"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { fieldValue } from "@/lib/application/form-value"
import { readTokenFromUrl } from "@/lib/application/deep-links"

export function ResetPasswordForm({
  initialToken = "",
}: {
  initialToken?: string
}) {
  const { resetPassword, error, clearError } = useAuth()
  useClearAuthErrorOnMount()
  const hydrated = useHydrated()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState("")

  // The emailed link carries the token in the fragment (#token=…), which never
  // reaches the server - so it can only be read once we are in the browser.
  const tokenFromUrl = useBrowserValue(readTokenFromUrl, "")
  const token = tokenFromUrl || initialToken

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const newPassword = String(form.get("password") ?? "")
    if (newPassword !== confirmPassword) {
      return
    }
    setIsSubmitting(true)
    clearError()
    try {
      await resetPassword({ token, newPassword })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!hydrated) {
    return (
      <p className="mt-8 text-sm text-muted-foreground">
        Memuatkan pautan set semula…
      </p>
    )
  }

  if (!token) {
    return (
      <div className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Token set semula tidak sah atau telah tamat tempoh.
      </div>
    )
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={onSubmit}>
      <AuthErrorBanner error={error} onDismiss={clearError} />
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="password">Kata laluan baharu</FieldLabel>
          <PasswordField
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="Cipta kata laluan baharu"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="confirm-password">Sahkan kata laluan</FieldLabel>
          <PasswordField
            id="confirm-password"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Ulang kata laluan baharu"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(fieldValue(event))}
          />
        </Field>

        <Button
          type="submit"
          className="h-11 min-h-11 w-full"
          isDisabled={isSubmitting}
        >
          {isSubmitting ? "Menyimpan..." : "Set semula kata laluan"}
        </Button>
      </FieldGroup>
    </form>
  )
}
