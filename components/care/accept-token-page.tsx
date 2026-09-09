"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { BackButton } from "@/components/back-button"
import { useAuth } from "@/components/auth/auth-provider"
import { useCareData } from "@/components/care/care-data-provider"
import { Button, LinkButton } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  appPathForTokenKind,
  captureTokenFromUrl,
  consumeStoredToken,
  peekStoredToken,
  readTokenFromUrl,
  type TokenAcceptKind,
} from "@/lib/application/deep-links"
import { fieldValue } from "@/lib/application/form-value"
import { useBrowserValue } from "@/hooks/use-browser-value"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"

export function AcceptTokenPage({
  kind,
  initialToken,
}: {
  kind: TokenAcceptKind
  initialToken?: string
}) {
  const router = useRouter()
  const { status: authStatus } = useAuth()
  const { acceptInvite, acceptClaim, setSelectedProfileId } = useCareData()
  const [editedToken, setEditedToken] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const title = kind === "invite" ? "Terima jemputan" : "Terima tuntutan profil"

  // The token arrives in the URL fragment, so it is browser-only. Read it
  // directly rather than mirroring it into state from an effect; the effect
  // below only does the side effects (persist across login, strip from the URL).
  const readCapturedToken = useCallback(
    () => readTokenFromUrl() || peekStoredToken(kind) || initialToken || "",
    [initialToken, kind]
  )
  const capturedToken = useBrowserValue(readCapturedToken, initialToken ?? "")
  const token = editedToken ?? capturedToken

  useEffect(() => {
    captureTokenFromUrl(kind)
  }, [kind])

  if (authStatus === "loading") {
    return (
      <div className="flex flex-col gap-4">
        <BackButton href="/care-profiles" />
        <p className="text-sm text-muted-foreground">Memuatkan sesi…</p>
      </div>
    )
  }

  if (authStatus === "unauthenticated") {
    const next = appPathForTokenKind(kind)
    return (
      <div className="flex flex-col gap-4">
        <BackButton href="/care-profiles" />
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-xl">{title}</CardTitle>
            <CardDescription>
              Log masuk dahulu, kemudian kembali ke halaman ini untuk menerima
              token.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <LinkButton href={`/?next=${encodeURIComponent(next)}`}>
              Log masuk
            </LinkButton>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <BackButton href="/care-profiles" />
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">{title}</CardTitle>
          <CardDescription>
            Token dihantar melalui e-mel. Backend menerima token dalam badan
            POST (bukan URL). Pautan e-mel patut guna format{" "}
            <code className="text-xs">/accept/{kind}#token=…</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel>Token</FieldLabel>
            <Input
              className="h-11 bg-background"
              value={token}
              onChange={(event) => setEditedToken(fieldValue(event))}
              autoComplete="off"
            />
          </Field>
        </CardContent>
        <CardFooter className="justify-end">
          <Button
            isDisabled={isSubmitting || !token.trim()}
            onPress={() => {
              void (async () => {
                setIsSubmitting(true)
                try {
                  const trimmed = token.trim()
                  consumeStoredToken(kind)
                  const profileId =
                    kind === "invite"
                      ? await acceptInvite(trimmed)
                      : await acceptClaim(trimmed)
                  if (!profileId) {
                    toast.error("Token tidak sah atau sudah digunakan.")
                    return
                  }
                  setSelectedProfileId(profileId)
                  toast.success(
                    kind === "invite"
                      ? "Jemputan diterima."
                      : "Tuntutan profil diterima."
                  )
                  router.push(`/care-profiles/${profileId}`)
                } catch (error) {
                  toast.error(
                    isApiError(error)
                      ? messageForApiError(error)
                      : "Gagal menerima token."
                  )
                } finally {
                  setIsSubmitting(false)
                }
              })()
            }}
          >
            Terima
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
