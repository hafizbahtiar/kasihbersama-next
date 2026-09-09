"use client"

import Link from "next/link"
import { useState, type FormEvent } from "react"
import { useSearchParams } from "next/navigation"

import { useClearAuthErrorOnMount } from "@/hooks/use-clear-auth-error-on-mount"
import { AuthErrorBanner } from "@/components/care/async-state"
import { useAuth } from "@/components/auth/auth-provider"
import { PasswordField } from "@/components/auth/password-field"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

function safeRedirectPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return undefined
  }
  return next
}

export function LoginForm() {
  const searchParams = useSearchParams()
  const { login, error, clearError } = useAuth()
  useClearAuthErrorOnMount()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const redirectTo = safeRedirectPath(searchParams.get("next"))

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get("email") ?? "")
    const password = String(form.get("password") ?? "")
    setIsSubmitting(true)
    clearError()
    try {
      await login({ email, password }, redirectTo)
    } finally {
      setIsSubmitting(false)
    }
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
            className="h-11 min-h-11 bg-background"
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
          className="h-11 min-h-11 w-full"
          isDisabled={isSubmitting}
        >
          {isSubmitting ? "Log masuk..." : "Log masuk"}
        </Button>
      </FieldGroup>
    </form>
  )
}
