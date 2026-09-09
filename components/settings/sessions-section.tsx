"use client"

import { useState } from "react"
import { IconDeviceDesktop, IconLogout } from "@tabler/icons-react"
import { toast } from "sonner"

import { AsyncStateBanner } from "@/components/care/async-state"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import { useSessions } from "@/hooks/use-account-data"
import { formatDateTime } from "@/lib/application/care-format"

/**
 * The list of live logins.
 *
 * This is the one screen where a person can spot a login they do not
 * recognise, so it shows what identifies a device - browser, address, when it
 * started - and nothing that identifies the token itself.
 */
export function SessionsCard() {
  const sessions = useSessions()
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null)

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Peranti yang log masuk</CardTitle>
          <CardDescription>
            Tidak kenal salah satu? Tamatkan sesi itu, kemudian tukar kata
            laluan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AsyncStateBanner
            error={sessions.error}
            onRetry={() => {
              void sessions.reload()
            }}
            label="Gagal memuatkan sesi."
          />

          {sessions.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : sessions.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Tiada sesi aktif direkodkan.
            </p>
          ) : (
            <ItemGroup className="gap-3">
              {sessions.data.map((session) => (
                <Item key={session.id} variant="muted">
                  <ItemMedia variant="icon">
                    <IconDeviceDesktop />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className="flex flex-wrap items-center gap-2">
                      {session.userAgent ?? "Peranti tidak dikenali"}
                      {session.current ? (
                        <Badge variant="secondary">Peranti ini</Badge>
                      ) : null}
                    </ItemTitle>
                    <ItemDescription>
                      {session.ipAddress ? `${session.ipAddress} · ` : ""}
                      Mula {formatDateTime(session.createdAt)}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    {/* The current session is ended by logging out, not from
                        this list - offering "Tamatkan" here would look like a
                        way to secure the account while actually just signing
                        the user out of the device in front of them. */}
                    {session.current ? null : (
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={() => setRevokeTarget(session.id)}
                      >
                        Tamatkan
                      </Button>
                    )}
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={Boolean(revokeTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRevokeTarget(null)
          }
        }}
        title="Tamatkan sesi ini?"
        description="Peranti itu perlu log masuk semula untuk terus menggunakan akaun anda."
        confirmLabel="Tamatkan"
        variant="destructive"
        icon={<IconLogout />}
        onConfirm={() => {
          if (!revokeTarget) {
            return
          }
          void sessions
            .revoke(revokeTarget)
            .then(() => {
              toast.success("Sesi ditamatkan.")
              setRevokeTarget(null)
            })
            .catch(() => {
              toast.error("Gagal menamatkan sesi.")
              setRevokeTarget(null)
            })
        }}
      />
    </>
  )
}
