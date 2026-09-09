"use client"

import { useState } from "react"
import { IconDownload, IconTrash } from "@tabler/icons-react"
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item"
import { getAccountRepository } from "@/lib/composition/account-repository"
import {
  DELETION_BLOCK_FIXES,
  DELETION_BLOCK_LABELS,
  type DeletionBlocker,
} from "@/lib/domain/account"
import { fieldValue } from "@/lib/application/form-value"
import {
  deletionBlockersFromError,
  isApiError,
  messageForApiError,
} from "@/lib/infrastructure/api/errors"

export function ExportAccountCard() {
  const [isExporting, setIsExporting] = useState(false)

  async function download() {
    setIsExporting(true)
    try {
      const json = await getAccountRepository().exportAccount()
      // Built and revoked here rather than linking straight at the endpoint:
      // the API needs an Authorization header, which a plain <a href> cannot
      // send.
      const url = URL.createObjectURL(
        new Blob([json], { type: "application/json" })
      )
      const link = document.createElement("a")
      link.href = url
      link.download = "kasihbersama-data-saya.json"
      link.click()
      URL.revokeObjectURL(url)
      toast.success("Fail data anda dimuat turun.")
    } catch (cause) {
      toast.error(
        isApiError(cause) ? messageForApiError(cause) : "Gagal memuat turun."
      )
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Muat turun data saya</CardTitle>
        <CardDescription>
          Akaun anda, profil yang anda sertai, dan tindakan anda sendiri. Rekod
          jagaan orang lain tiada di dalamnya.
        </CardDescription>
      </CardHeader>
      <CardFooter className="justify-end">
        <Button
          variant="outline"
          isDisabled={isExporting}
          onPress={() => {
            void download()
          }}
        >
          <IconDownload />
          {isExporting ? "Menyediakan..." : "Muat turun (JSON)"}
        </Button>
      </CardFooter>
    </Card>
  )
}

export function DeleteAccountCard() {
  const { logout } = useAuth()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [blockers, setBlockers] = useState<DeletionBlocker[]>([])
  const [isDeleting, setIsDeleting] = useState(false)

  // Typing the word is the friction that belongs here: this is the one action
  // in the app with no undo, and a password field alone is the same gesture
  // the user performs to change their name.
  const confirmed = confirm.trim().toUpperCase() === "PADAM"

  async function remove() {
    if (!password) {
      setError("Masukkan kata laluan anda.")
      return
    }
    setIsDeleting(true)
    setError(null)
    setBlockers([])
    try {
      const result = await getAccountRepository().deleteAccount(password)
      if (result.deletedCareProfileIds.length > 0) {
        toast.success(
          `Akaun dipadam. ${result.deletedCareProfileIds.length} profil jagaan turut dipadam.`
        )
      } else {
        toast.success("Akaun dipadam.")
      }
      await logout()
    } catch (cause) {
      const blocked = deletionBlockersFromError(cause)
      if (blocked.length > 0) {
        setBlockers(blocked)
        setError(null)
        return
      }
      setError(
        isApiError(cause)
          ? cause.status === 401
            ? "Kata laluan tidak tepat."
            : messageForApiError(cause)
          : "Gagal memadam akaun."
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-destructive">Padam akaun</CardTitle>
        <CardDescription>
          Tindakan ini kekal. Tiada cara untuk membatalkannya.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTitle>Apa yang berlaku</AlertTitle>
          <AlertDescription>
            Nama, e-mel dan kata laluan anda dibuang. Profil jagaan yang anda
            sahaja ahlinya turut dipadam, termasuk dokumen yang dimuat naik ke
            dalamnya. Log jagaan yang anda tulis untuk keluarga lain kekal,
            tanpa nama anda - itu rekod mereka, bukan milik anda untuk dipadam.
          </AlertDescription>
        </Alert>

        {blockers.length > 0 ? (
          <div className="space-y-2">
            <Alert variant="destructive">
              <AlertTitle>Selesaikan profil ini dahulu</AlertTitle>
              <AlertDescription>
                Akaun anda belum dipadam. Profil di bawah memerlukan keputusan
                anda.
              </AlertDescription>
            </Alert>
            <ItemGroup className="gap-2">
              {blockers.map((item) => (
                <Item key={item.id} variant="muted">
                  <ItemContent>
                    <ItemTitle>{item.displayName}</ItemTitle>
                    <ItemDescription>
                      {DELETION_BLOCK_LABELS[item.reason]} ·{" "}
                      {DELETION_BLOCK_FIXES[item.reason]}
                    </ItemDescription>
                  </ItemContent>
                </Item>
              ))}
            </ItemGroup>
          </div>
        ) : null}

        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="delete-password">Kata laluan</FieldLabel>
          <PasswordField
            id="delete-password"
            name="delete_password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(fieldValue(event))}
          />
          {error ? <FieldError>{error}</FieldError> : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="delete-confirm">
            Taip PADAM untuk mengesahkan
          </FieldLabel>
          <Input
            id="delete-confirm"
            size="xl"
            className="bg-background"
            value={confirm}
            onChange={(event) => setConfirm(fieldValue(event))}
          />
        </Field>
      </CardContent>
      <CardFooter className="justify-end">
        <Button
          variant="destructive"
          isDisabled={!confirmed || isDeleting}
          onPress={() => {
            void remove()
          }}
        >
          <IconTrash />
          {isDeleting ? "Memadam..." : "Padam akaun saya"}
        </Button>
      </CardFooter>
    </Card>
  )
}
