"use client"

import { useState } from "react"
import { IconDeviceMobile, IconShieldCheck } from "@tabler/icons-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { createDataTableColumnHelper, DataTable } from "@/components/data-table"
import { TableActionButton, TableActions } from "@/components/table-actions"
import { StatusChip } from "@/components/status-chip"
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

  const helper = createDataTableColumnHelper<AuthDevice>()
  const columns = helper.columns([
    helper.accessor((row) => deviceTitle(row), {
      id: "device",
      header: "Peranti",
      cell: ({ row, getValue }) => (
        <div className="min-w-0 space-y-0.5">
          <p className="font-medium">{getValue()}</p>
          <p className="truncate text-xs text-muted-foreground">
            {[
              platformLabel(row.original.platform),
              row.original.model,
              row.original.osVersion,
              row.original.appVersion ? `App ${row.original.appVersion}` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      ),
    }),
    helper.accessor((row) => (row.isTrusted ? "dipercayai" : "belum"), {
      id: "trust",
      header: "Kepercayaan",
      filterFn: "equalsString",
      cell: ({ row }) =>
        row.original.isTrusted ? (
          <StatusChip tone="positive" label="Dipercayai" />
        ) : (
          <StatusChip tone="attention" label="Belum dipercayai" />
        ),
    }),
    helper.accessor((row) => row.lastSeenAt ?? row.createdAt, {
      id: "lastSeen",
      header: "Kali terakhir",
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{dateTime(getValue())}</span>
      ),
    }),
    helper.display({
      id: "action",
      header: () => <span className="flex justify-end">Tindakan</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <TableActions>
          {/* Kepercayaan hanya ditetapkan, tidak pernah dibatalkan: backend ada
              laluan trust dan tiada untrust, jadi tiada kawalan sebaliknya. */}
          {row.original.isTrusted ? null : (
            <TableActionButton
              aria-label={`Tandakan dipercayai: ${deviceTitle(row.original)}`}
              onPress={() => {
                void devices
                  .trust(row.original.id)
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
              Percaya
            </TableActionButton>
          )}
          <TableActionButton
            aria-label={`Tarik balik ${deviceTitle(row.original)}`}
            onPress={() => setRevokeTarget(row.original.id)}
          >
            Tarik balik
          </TableActionButton>
        </TableActions>
      ),
    }),
  ])

  return (
    <>
      <DataTable
        columns={columns}
        data={devices.data}
        getRowId={(row) => row.id}
        isLoading={devices.isLoading}
        errorMessage={
          devices.error ? messageForApiError(devices.error) : undefined
        }
        onRetry={() => {
          void devices.reload()
        }}
        pageSize={5}
        searchable
        searchPlaceholder="Cari peranti..."
        toolbarStart={
          <div className="space-y-1">
            <h2 className="font-heading text-lg tracking-tight">
              Peranti yang dikenali
            </h2>
            <p className="text-sm text-muted-foreground">
              Peranti yang pernah log masuk ke akaun anda. Peranti dipercayai
              tidak perlu memasukkan kod MFA lagi.
            </p>
          </div>
        }
        emptyIcon={<IconDeviceMobile />}
        emptyTitle="Tiada peranti direkodkan"
        emptyDescription="Peranti muncul di sini selepas ia log masuk."
      />

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
