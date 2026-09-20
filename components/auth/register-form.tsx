"use client"

import Link from "next/link"
import { useState, type FormEvent } from "react"

import { useClearAuthErrorOnMount } from "@/hooks/use-clear-auth-error-on-mount"
import { AuthErrorBanner } from "@/components/shared/async-state"
import { useAuth } from "@/components/auth/auth-provider"
import { PasswordField } from "@/components/auth/password-field"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { fieldValue } from "@/lib/application/form-value"

/** The backend's own floor (`minLength:"10"` on the register body). */
const MIN_PASSWORD_LENGTH = 10

export function RegisterForm() {
  const { register, error, clearError } = useAuth()
  useClearAuthErrorOnMount()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState("")
  const [formError, setFormError] = useState<string | null>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const displayName = String(form.get("name") ?? "").trim()
    const email = String(form.get("email") ?? "")
    const password = String(form.get("password") ?? "")
    const terms = form.get("terms")
    if (!terms) {
      return
    }
    // Checked here so the answer is immediate; the backend enforces both
    // anyway and its refusal would arrive as a single toast for the form.
    if (password.length < MIN_PASSWORD_LENGTH) {
      setFormError(
        `Kata laluan mesti sekurang-kurangnya ${MIN_PASSWORD_LENGTH} aksara.`
      )
      return
    }
    if (password !== confirmPassword) {
      setFormError("Kata laluan tidak sepadan.")
      return
    }
    setFormError(null)
    setIsSubmitting(true)
    clearError()
    try {
      await register({ email, password, displayName })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={onSubmit}>
      <AuthErrorBanner error={error} onDismiss={clearError} />
      {formError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {formError}
        </p>
      ) : null}
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Nama penuh</FieldLabel>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Nama anda"
            autoComplete="name"
            required
            size="xl"
            className="bg-background"
          />
        </Field>

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
          <FieldLabel htmlFor="password">Kata laluan</FieldLabel>
          <PasswordField
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="Cipta kata laluan"
            minLength={MIN_PASSWORD_LENGTH}
          />
          <p className="text-sm text-muted-foreground">
            Sekurang-kurangnya {MIN_PASSWORD_LENGTH} aksara.
          </p>
        </Field>

        <Field>
          <FieldLabel htmlFor="confirm-password">Sahkan kata laluan</FieldLabel>
          <PasswordField
            id="confirm-password"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Ulang kata laluan"
            minLength={MIN_PASSWORD_LENGTH}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(fieldValue(event))}
          />
        </Field>

        <Field orientation="horizontal" className="items-start">
          <Checkbox id="terms" name="terms" className="mt-0.5" isRequired />
          <FieldLabel
            htmlFor="terms"
            className="font-normal text-muted-foreground"
          >
            Saya bersetuju dengan{" "}
            <Link
              href="/terms"
              className="font-medium text-primary underline-offset-4 hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              terma penggunaan
            </Link>{" "}
            dan{" "}
            <Link
              href="/privacy"
              className="font-medium text-primary underline-offset-4 hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              dasar privasi
            </Link>
            .
          </FieldLabel>
        </Field>

        <Button
          type="submit"
          size="xl"
          className="w-full"
          isDisabled={isSubmitting}
        >
          {isSubmitting ? "Mendaftar..." : "Daftar"}
        </Button>
      </FieldGroup>
    </form>
  )
}
