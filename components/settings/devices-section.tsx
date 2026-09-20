"use client"

import { useState } from "react"
import {
  IconDeviceDesktop,
  IconDeviceMobile,
  IconShieldCheck,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { AsyncStateBanner } from "@/components/shared/async-state"
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
import { useAuthDevices } from "@/hooks/use-account-data"
import { useDisplayFormat } from "@/lib/application/display-preferences"
import { platformLabel, type AuthDevice } from "@/lib/domain/account"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"

/** What identifies a device, most specific field first. */
function deviceTitle(device: AuthDevice) {
  return device.name ?? device.model ?? platformLabel(device.platform)
}

/**
 * The signed-in devices - the install records, not the push subscriptions
 * shown above. A trusted device skips the MFA code on the next login, so this
 * list is where a person revokes a device they no longer hold, and where they
 * promote one they do to trusted.
 */
export function DevicesCard() {
  const devices = useAuthDevices()
  const { dateTime } = useDisplayFormat()
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null)

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Peranti yang dikenali</CardTitle>
          <CardDescription>
            Peranti yang pernah log masuk ke akaun anda. Peranti dipercayai
            tidak perlu memasukkan kod MFA lagi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AsyncStateBanner
            error={devices.error}
            onRetry={() => {
              void devices.reload()
            }}
            label="Gagal memuatkan peranti."
          />

          {devices.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : devices.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Tiada peranti direkodkan lagi.
            </p>
          ) : (
            <ItemGroup className="gap-3">
              {devices.data.map((device) => (
                <Item key={device.id} variant="muted">
                  <ItemMedia variant="icon">
                    {device.platform === "web" ||
                    device.platform === "desktop" ? (
                      <IconDeviceDesktop />
                    ) : (
                      <IconDeviceMobile />
                    )}
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className="flex flex-wrap items-center gap-2">
                      {deviceTitle(device)}
                      {device.isTrusted ? (
                        <Badge variant="secondary">Dipercayai</Badge>
                      ) : (
                        <Badge variant="outline">Belum dipercayai</Badge>
                      )}
                    </ItemTitle>
                    <ItemDescription className="space-y-0.5">
                      <span className="block">
                        {[
                          platformLabel(device.platform),
                          device.model,
                          device.osVersion,
                          device.appVersion
                            ? `App ${device.appVersion}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      <span className="block">
                        {device.lastSeenAt
                          ? `Kali terakhir ${dateTime(device.lastSeenAt)}`
                          : `Didaftarkan ${dateTime(device.createdAt)}`}
                        {device.isTrusted && device.trustedAt
                          ? ` · Dipercayai ${dateTime(device.trustedAt)}`
                          : ""}
                      </span>
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    {/* Trust is only ever set, never cleared: the backend has
                        a trust route and no untrust, so no reverse control is
                        offered. */}
                    {device.isTrusted ? null : (
                      <Button
                        size="sm"
                        onPress={() => {
                          void devices
                            .trust(device.id)
                            .then(() => {
                              toast.success("Peranti ditandakan dipercayai.")
                            })
                            .catch((cause) => {
                              toast.error(
                                isApiError(cause)
                                  ? messageForApiError(cause)
                                  : "Gagal menandakan peranti."
                              )
                            })
                        }}
                      >
                        <IconShieldCheck />
                        Tandakan dipercayai
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => setRevokeTarget(device.id)}
                    >
                      Tarik balik
                    </Button>
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
        title="Tarik balik peranti ini?"
        description="Peranti ini dibuang daripada senarai peranti yang dikenali. Ia akan muncul semula jika ia log masuk lagi."
        confirmLabel="Tarik balik"
        variant="destructive"
        onConfirm={() => {
          if (!revokeTarget) {
            return
          }
          void devices
            .revoke(revokeTarget)
            .then(() => {
              toast.success("Peranti ditarik balik.")
              setRevokeTarget(null)
            })
            .catch((cause) => {
              toast.error(
                isApiError(cause)
                  ? messageForApiError(cause)
                  : "Gagal menarik balik peranti."
              )
              setRevokeTarget(null)
            })
        }}
      />
    </>
  )
}
