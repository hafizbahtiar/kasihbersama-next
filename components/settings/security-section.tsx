"use client"

import { useState } from "react"
import { toast } from "sonner"

import { useAuth } from "@/components/auth/auth-provider"
import { PasswordField } from "@/components/auth/password-field"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getAccountRepository } from "@/lib/composition/account-repository"
import { MIN_PASSWORD_LENGTH } from "@/lib/domain/account"
import { fieldValue } from "@/lib/application/form-value"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"

/**
 * Turns a failed security write into the message that belongs next to the
 * field that caused it.
 *
 * 401 needs its own arm: the shared map answers "Sila log masuk semula", which
 * is true of every other 401 in the app and false here - the session is fine,
 * the password typed into the form is not, and telling the user to sign in
 * again sends them to fix the wrong thing.
 */
function currentPasswordError(cause: unknown) {
  if (isApiError(cause) && cause.status === 401) {
    return "Kata laluan semasa tidak tepat."
  }
  return null
}

export function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)

  async function submit() {
    const nextErrors: Record<string, string> = {}
    if (!currentPassword) {
      nextErrors.currentPassword = "Masukkan kata laluan semasa."
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      nextErrors.newPassword = `Sekurang-kurangnya ${MIN_PASSWORD_LENGTH} aksara.`
    }
    if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = "Kata laluan tidak sepadan."
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSaving(true)
    try {
      await getAccountRepository().changePassword({
        currentPassword,
        newPassword,
      })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.success("Kata laluan ditukar. Peranti lain telah dilog keluar.")
    } catch (cause) {
      const wrongPassword = currentPasswordError(cause)
      if (wrongPassword) {
        setErrors({ currentPassword: wrongPassword })
        return
      }
      // Strength is decided by the server, so its wording is the only accurate
      // one to show - a local guess would contradict it.
      setErrors({
        newPassword: isApiError(cause)
          ? messageForApiError(cause)
          : "Gagal menukar kata laluan.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tukar kata laluan</CardTitle>
        <CardDescription>
          Peranti lain akan dilog keluar. Peranti ini kekal log masuk.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field data-invalid={Boolean(errors.currentPassword)}>
            <FieldLabel htmlFor="current-password">
              Kata laluan semasa
            </FieldLabel>
            <PasswordField
              id="current-password"
              name="current_password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(fieldValue(event))}
            />
            {errors.currentPassword ? (
              <FieldError>{errors.currentPassword}</FieldError>
            ) : null}
          </Field>
          <Field data-invalid={Boolean(errors.newPassword)}>
            <FieldLabel htmlFor="new-password">Kata laluan baharu</FieldLabel>
            <PasswordField
              id="new-password"
              name="new_password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(fieldValue(event))}
            />
            <FieldDescription>
              Sekurang-kurangnya {MIN_PASSWORD_LENGTH} aksara. Elakkan perkataan
              biasa.
            </FieldDescription>
            {errors.newPassword ? (
              <FieldError>{errors.newPassword}</FieldError>
            ) : null}
          </Field>
          <Field data-invalid={Boolean(errors.confirmPassword)}>
            <FieldLabel htmlFor="confirm-new-password">
              Sahkan kata laluan baharu
            </FieldLabel>
            <PasswordField
              id="confirm-new-password"
              name="confirm_new_password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(fieldValue(event))}
            />
            {errors.confirmPassword ? (
              <FieldError>{errors.confirmPassword}</FieldError>
            ) : null}
          </Field>
        </FieldGroup>
      </CardContent>
      <CardFooter className="justify-end">
        <Button
          isDisabled={isSaving}
          onPress={() => {
            void submit()
          }}
        >
          {isSaving ? "Menukar..." : "Tukar kata laluan"}
        </Button>
      </CardFooter>
    </Card>
  )
}

export function ChangeEmailCard() {
  const { user, retryBootstrap } = useAuth()
  const [newEmail, setNewEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)

  async function submit() {
    const nextErrors: Record<string, string> = {}
    if (!newEmail.trim()) {
      nextErrors.newEmail = "Masukkan e-mel baharu."
    }
    if (!currentPassword) {
      nextErrors.currentPassword = "Masukkan kata laluan semasa."
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSaving(true)
    try {
      await getAccountRepository().changeEmail({
        currentPassword,
        newEmail: newEmail.trim(),
      })
      setNewEmail("")
      setCurrentPassword("")
      // Re-read /me rather than trusting the response into local state: the
      // account is now unverified, and every gate in the app reads that from
      // the provider.
      await retryBootstrap()
      toast.success("E-mel ditukar. Sahkan e-mel baharu anda.")
    } catch (cause) {
      const wrongPassword = currentPasswordError(cause)
      if (wrongPassword) {
        setErrors({ currentPassword: wrongPassword })
        return
      }
      setErrors({
        newEmail: isApiError(cause)
          ? messageForApiError(cause)
          : "Gagal menukar e-mel.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tukar e-mel</CardTitle>
        <CardDescription>
          E-mel baharu perlu disahkan semula sebelum boleh digunakan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTitle>Sebelum tukar</AlertTitle>
          <AlertDescription>
            Jemputan yang belum dijawab ke e-mel lama akan terputus. Terima atau
            batalkan jemputan itu dahulu.
          </AlertDescription>
        </Alert>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="current-email">E-mel semasa</FieldLabel>
            <Input
              id="current-email"
              value={user?.email ?? ""}
              readOnly
              className="h-11 bg-muted"
            />
          </Field>
          <Field data-invalid={Boolean(errors.newEmail)}>
            <FieldLabel htmlFor="new-email">E-mel baharu</FieldLabel>
            <Input
              id="new-email"
              type="email"
              autoComplete="email"
              value={newEmail}
              onChange={(event) => setNewEmail(fieldValue(event))}
              className="h-11 bg-background"
            />
            {errors.newEmail ? (
              <FieldError>{errors.newEmail}</FieldError>
            ) : null}
          </Field>
          <Field data-invalid={Boolean(errors.currentPassword)}>
            <FieldLabel htmlFor="email-current-password">
              Kata laluan semasa
            </FieldLabel>
            <PasswordField
              id="email-current-password"
              name="email_current_password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(fieldValue(event))}
            />
            {errors.currentPassword ? (
              <FieldError>{errors.currentPassword}</FieldError>
            ) : null}
          </Field>
        </FieldGroup>
      </CardContent>
      <CardFooter className="justify-end">
        <Button
          isDisabled={isSaving}
          onPress={() => {
            void submit()
          }}
        >
          {isSaving ? "Menukar..." : "Tukar e-mel"}
        </Button>
      </CardFooter>
    </Card>
  )
}
