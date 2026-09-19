"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { IconAlertTriangle, IconMailCheck } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getAuthRepository } from "@/lib/composition/auth-repository"
import {
  messageForApiError,
  normalizeApiError,
  type ApiError,
} from "@/lib/infrastructure/api/errors"

/**
 * Completes an email change from the link mailed to the new address.
 *
 * The token names the account, not the session - the caller follows the link
 * from their inbox and is usually signed out - so unlike the other auth forms
 * this does not go through useAuth(), whose job is session state. It reaches
 * the repository the same way the settings cards reach theirs.
 */
export function ConfirmEmailChangeForm({ token }: { token?: string }) {
  const router = useRouter()
  const [error, setError] = useState<ApiError | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const autoSubmitted = useRef(false)

  useEffect(() => {
    const trimmed = token?.trim()
    if (!trimmed || autoSubmitted.current || submitted || isSubmitting) {
      return
    }
    autoSubmitted.current = true
    setIsSubmitting(true)
    setError(null)
    void getAuthRepository()
      .confirmEmailChange(trimmed)
      .then(() => setSubmitted(true))
      .catch((cause) => setError(normalizeApiError(cause)))
      .finally(() => setIsSubmitting(false))
  }, [token, submitted, isSubmitting])

  if (submitted) {
    return (
      <div className="mt-8 space-y-4">
        <Alert>
          <IconMailCheck />
          <AlertTitle>E-mel ditukar</AlertTitle>
          <AlertDescription>
            Alamat baharu anda kini aktif dan disahkan. Gunakannya untuk log
            masuk.
          </AlertDescription>
        </Alert>
        <Button size="xl" className="w-full" onPress={() => router.push("/")}>
          Teruskan
        </Button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-8 space-y-4">
        <Alert>
          <IconAlertTriangle />
          <AlertTitle>Pautan tidak sah</AlertTitle>
          <AlertDescription>
            {messageForApiError(error)} Minta pautan baharu dari Tetapan, di
            bahagian Keselamatan.
          </AlertDescription>
        </Alert>
        <Button
          size="xl"
          className="w-full"
          onPress={() => router.push("/settings")}
        >
          Minta pautan baharu
        </Button>
      </div>
    )
  }

  if (!token?.trim()) {
    return (
      <div className="mt-8 space-y-4">
        <Alert>
          <IconAlertTriangle />
          <AlertTitle>Pautan tidak lengkap</AlertTitle>
          <AlertDescription>
            Pautan ini tiada token. Buka pautan penuh dari e-mel anda, atau
            minta pautan baharu dari Tetapan.
          </AlertDescription>
        </Alert>
        <Button
          size="xl"
          className="w-full"
          onPress={() => router.push("/settings")}
        >
          Minta pautan baharu
        </Button>
      </div>
    )
  }

  return (
    <p className="mt-8 text-sm text-muted-foreground">Mengesahkan pautan...</p>
  )
}
