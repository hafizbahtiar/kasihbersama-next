"use client"

import { useState } from "react"
import { IconShieldLock } from "@tabler/icons-react"
import { QRCodeSVG } from "qrcode.react"
import { toast } from "sonner"

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
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { getAuthRepository } from "@/lib/composition/auth-repository"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"

const MFA_CODE_LENGTH = 6

type Enrolment = { secret: string; otpauthUrl: string }

/**
 * Enrols a TOTP factor, then shows the recovery codes exactly once.
 *
 * There is no endpoint that answers "does this account already have a
 * confirmed factor". `GET /auth/me` reports only the current session's
 * `mfa_level`, and even that is inconclusive - a trusted device skips MFA, so
 * a session at level 1 can belong to an account that is fully enrolled. The
 * frontend maps nothing to it. So this card offers the setup action and never
 * renders an "MFA aktif / tidak aktif" badge: a badge would state a fact the
 * backend cannot back. `recoveryCodes` below is a success noticed in this
 * session only - it is local state, so it does not survive a reload, and a
 * second visit still offers setup (the server keeps a pending factor until it
 * is confirmed, so a fresh enrol just adds another one).
 */
export function MfaCard() {
  const [enrolment, setEnrolment] = useState<Enrolment | null>(null)
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)

  async function start() {
    setIsBusy(true)
    setError(null)
    try {
      setEnrolment(await getAuthRepository().enrollMfa())
    } catch (cause) {
      toast.error(
        isApiError(cause)
          ? messageForApiError(cause)
          : "Gagal memulakan penyediaan MFA."
      )
    } finally {
      setIsBusy(false)
    }
  }

  async function confirm() {
    if (code.length !== MFA_CODE_LENGTH) {
      setError(`Masukkan ${MFA_CODE_LENGTH} digit kod.`)
      return
    }
    setIsBusy(true)
    setError(null)
    try {
      const result = await getAuthRepository().confirmMfa(code)
      setRecoveryCodes(result.recoveryCodes)
      setEnrolment(null)
      setCode("")
      toast.success("Pengesahan dua langkah diaktifkan.")
    } catch (cause) {
      // `auth.mfa.code_invalid` and `auth.mfa.not_enrolled` both already have
      // Malay copy in the shared error map, so the failure text is reused
      // rather than re-worded here.
      setError(
        isApiError(cause) ? messageForApiError(cause) : "Gagal mengesahkan kod."
      )
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengesahan dua langkah (MFA)</CardTitle>
        <CardDescription>
          Aplikasi pengesah menjana kod 6 digit yang diperlukan setiap kali log
          masuk dari peranti yang tidak dipercayai.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recoveryCodes.length > 0 ? (
          <div className="space-y-3">
            <Alert>
              <AlertTitle>Simpan kod pemulihan ini sekarang</AlertTitle>
              <AlertDescription>
                Kod ini dipaparkan sekali sahaja dan tidak boleh dilihat semula.
                Setiap kod boleh digunakan sekali jika anda hilang akses kepada
                aplikasi pengesah.
              </AlertDescription>
            </Alert>
            <ul className="grid grid-cols-2 gap-2 font-mono text-sm">
              {recoveryCodes.map((item) => (
                <li key={item} className="rounded-md bg-muted px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : enrolment ? (
          <div className="space-y-4">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <span className="rounded-md bg-white p-2 ring-1 ring-foreground/10">
                <QRCodeSVG value={enrolment.otpauthUrl} size={140} level="M" />
              </span>
              <div className="space-y-1 text-sm">
                <p className="font-medium">
                  1. Imbas kod QR dengan aplikasi pengesah
                </p>
                <p className="text-muted-foreground">
                  Tidak boleh imbas? Masukkan rahsia ini secara manual:
                </p>
                <code className="block break-all rounded-md bg-muted px-2 py-1 font-mono text-xs">
                  {enrolment.secret}
                </code>
              </div>
            </div>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="mfa-code">
                2. Masukkan kod 6 digit
              </FieldLabel>
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
              <FieldDescription>
                Kod daripada aplikasi pengesah, sah untuk 30 saat.
              </FieldDescription>
              {error ? <FieldError>{error}</FieldError> : null}
            </Field>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Sediakan pengesahan dua langkah untuk menambah lapisan keselamatan
            pada akaun anda. Kami tidak dapat mengesahkan sama ada MFA sudah
            aktif pada akaun ini.
          </p>
        )}
      </CardContent>
      <CardFooter className="justify-end gap-2">
        {recoveryCodes.length > 0 ? (
          // Closes the flow and clears the codes from the page. Without it the
          // footer renders empty and the codes sit there until a reload.
          <Button variant="outline" onPress={() => setRecoveryCodes([])}>
            Saya sudah simpan
          </Button>
        ) : enrolment ? (
          <>
            <Button
              variant="outline"
              isDisabled={isBusy}
              onPress={() => {
                setEnrolment(null)
                setCode("")
                setError(null)
              }}
            >
              Batal
            </Button>
            <Button
              isDisabled={isBusy || code.length !== MFA_CODE_LENGTH}
              onPress={() => {
                void confirm()
              }}
            >
              {isBusy ? "Mengesahkan..." : "Sahkan & aktifkan"}
            </Button>
          </>
        ) : (
          <Button
            isDisabled={isBusy}
            onPress={() => {
              void start()
            }}
          >
            <IconShieldLock />
            {isBusy ? "Menyediakan..." : "Sediakan MFA"}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
