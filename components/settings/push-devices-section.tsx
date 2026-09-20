"use client"

import { IconDeviceMobile } from "@tabler/icons-react"

import { createDataTableColumnHelper, DataTable } from "@/components/data-table"
import { TableActionButton, TableActions } from "@/components/table-actions"
import { useDisplayFormat } from "@/lib/application/display-preferences"
import { platformLabel, type DeviceToken } from "@/lib/domain/account"
import type { ApiError } from "@/lib/infrastructure/api/errors"
import { messageForApiError } from "@/lib/infrastructure/api/errors"

/**
 * Push subscriptions - devices that can be REACHED. Separate from
 * `DevicesCard`, which lists devices that have signed in: two questions, two
 * tables (docs/05 §9).
 */
export function PushDeviceTable({
  devices,
  onRevoke,
}: {
  devices: {
    data: DeviceToken[]
    isLoading: boolean
    error: ApiError | null
    reload: () => Promise<void>
  }
  onRevoke: (deviceTokenId: string) => void
}) {
  const { dateTime } = useDisplayFormat()

  const helper = createDataTableColumnHelper<DeviceToken>()
  const columns = helper.columns([
    helper.accessor((row) => platformLabel(row.platform), {
      id: "platform",
      header: "Platform",
      cell: ({ row, getValue }) => (
        <div className="min-w-0 space-y-0.5">
          <p className="font-medium">{getValue()}</p>
          <p className="truncate text-xs text-muted-foreground">
            {row.original.providerSubscriptionId}
          </p>
        </div>
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
          <TableActionButton
            aria-label={`Keluarkan ${platformLabel(row.original.platform)}`}
            onPress={() => onRevoke(row.original.id)}
          >
            Keluarkan
          </TableActionButton>
        </TableActions>
      ),
    }),
  ])

  return (
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
      toolbarStart={
        <div className="space-y-1">
          <h2 className="font-heading text-lg tracking-tight">Peranti push</h2>
          <p className="text-sm text-muted-foreground">
            Peranti yang menerima push melalui subscription id pembekal.
          </p>
        </div>
      }
      emptyIcon={<IconDeviceMobile />}
      emptyTitle="Tiada peranti didaftarkan"
      emptyDescription="Daftar melalui aplikasi mudah alih Kasih Bersama."
    />
  )
}
