"use client"

import { useState } from "react"
import { IconDeviceDesktop, IconLogout } from "@tabler/icons-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { createDataTableColumnHelper, DataTable } from "@/components/data-table"
import { TableActionButton, TableActions } from "@/components/table-actions"
import { Badge } from "@/components/ui/badge"
import { useSessions } from "@/hooks/use-account-data"
import { useDisplayFormat } from "@/lib/application/display-preferences"
import type { UserSession } from "@/lib/domain/account"
import { messageForApiError } from "@/lib/infrastructure/api/errors"

/**
 * The list of live logins.
 *
 * This is the one screen where a person can spot a login they do not
 * recognise, so it shows what identifies a device - browser, address, when it
 * started - and nothing that identifies the token itself.
 */
export function SessionsCard() {
  const sessions = useSessions()
  const { dateTime } = useDisplayFormat()
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null)

  const helper = createDataTableColumnHelper<UserSession>()
  const columns = helper.columns([
    helper.accessor((row) => row.userAgent ?? "Peranti tidak dikenali", {
      id: "device",
      header: "Peranti",
      cell: ({ row, getValue }) => (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{getValue()}</span>
          {row.original.current ? (
            <Badge variant="secondary">Peranti ini</Badge>
          ) : null}
        </div>
      ),
    }),
    helper.accessor((row) => row.ipAddress ?? "-", {
      id: "ip",
      header: "Alamat IP",
    }),
    helper.accessor("createdAt", {
      header: "Mula",
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{dateTime(getValue())}</span>
      ),
    }),
    helper.display({
      id: "action",
      header: () => <span className="flex justify-end">Tindakan</span>,
      enableSorting: false,
      // Sesi semasa ditamatkan dengan log keluar, bukan dari senarai ini -
      // "Tamatkan" di sini kelihatan seperti cara mengamankan akaun sedangkan
      // ia hanya mengelog keluar peranti yang ada di depan pengguna.
      cell: ({ row }) =>
        row.original.current ? null : (
          <TableActions>
            <TableActionButton
              aria-label="Tamatkan sesi ini"
              onPress={() => setRevokeTarget(row.original.id)}
            >
              Tamatkan
            </TableActionButton>
          </TableActions>
        ),
    }),
  ])

  return (
    <>
      <DataTable
        columns={columns}
        data={sessions.data}
        getRowId={(row) => row.id}
        isLoading={sessions.isLoading}
        errorMessage={
          sessions.error ? messageForApiError(sessions.error) : undefined
        }
        onRetry={() => {
          void sessions.reload()
        }}
        pageSize={5}
        toolbarStart={
          <div className="space-y-1">
            <h2 className="font-heading text-lg tracking-tight">
              Peranti yang log masuk
            </h2>
            <p className="text-sm text-muted-foreground">
              Tidak kenal salah satu? Tamatkan sesi itu, kemudian tukar kata
              laluan.
            </p>
          </div>
        }
        emptyIcon={<IconDeviceDesktop />}
        emptyTitle="Tiada sesi aktif"
        emptyDescription="Sesi log masuk akan disenaraikan di sini."
      />

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
