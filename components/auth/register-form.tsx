"use client"

import { useState, type FormEvent } from "react"

import { useClearAuthErrorOnMount } from "@/hooks/use-clear-auth-error-on-mount"
import { AuthErrorBanner } from "@/components/care/async-state"
import { useAuth } from "@/components/auth/auth-provider"
import { PasswordField } from "@/components/auth/password-field"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { fieldValue } from "@/lib/application/form-value"

export function RegisterForm() {
  const { register, error, clearError } = useAuth()
  useClearAuthErrorOnMount()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState("")

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
    if (password !== confirmPassword) {
      return
    }
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
            className="h-11 min-h-11 bg-background"
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
            className="h-11 min-h-11 bg-background"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Kata laluan</FieldLabel>
          <PasswordField
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="Cipta kata laluan"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="confirm-password">Sahkan kata laluan</FieldLabel>
          <PasswordField
            id="confirm-password"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Ulang kata laluan"
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
            Saya bersetuju dengan terma penggunaan dan dasar privasi.
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
