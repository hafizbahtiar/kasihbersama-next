"use client"

import { useCallback } from "react"
import { IconBell, IconCheck, IconChecks } from "@tabler/icons-react"
import { toast } from "sonner"

import { createDataTableColumnHelper, DataTable } from "@/components/data-table"
import { usePlatform } from "@/components/platform/platform-provider"
import { TableActionButton, TableActions } from "@/components/table-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useNotifications } from "@/hooks/use-notifications"
import { useDisplayFormat } from "@/lib/application/display-preferences"
import type { AppNotification } from "@/lib/domain/notification"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"

export function NotificationInbox() {
  const inbox = useNotifications()
  const { dateTime } = useDisplayFormat()
  const { refresh: refreshBootstrap } = usePlatform()

  // useCallback: dirujuk dalam sel jadual, jadi identiti stabil menghalang lajur
  // daripada dibina semula setiap render.
  const run = useCallback(
    async (action: Promise<void>, done: string) => {
      try {
        await action
        toast.success(done)
        // Lencana belum dibaca hidup dalam bootstrap, jadi ia dibaca semula -
        // kiraan itu milik pelayan, bukan nombor yang skrin ini tolak sendiri.
        void refreshBootstrap()
      } catch (cause) {
        toast.error(
          isApiError(cause) ? messageForApiError(cause) : "Tindakan gagal."
        )
      }
    },
    [refreshBootstrap]
  )

  // Tanpa useMemo: React Compiler yang memoize komponen ini (lihat circle-detail).
  const helper = createDataTableColumnHelper<AppNotification>()
  const columns = helper.columns([
    helper.accessor("title", {
      header: "Pemberitahuan",
      cell: ({ row }) => (
        <div className="min-w-0 space-y-0.5">
          <p className="font-medium">{row.original.title}</p>
          {row.original.body ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {row.original.body}
            </p>
          ) : null}
        </div>
      ),
    }),
    helper.accessor((row) => (row.readAt ? "dibaca" : "baharu"), {
      id: "status",
      header: "Status",
      filterFn: "equalsString",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1.5">
          {row.original.readAt ? (
            <Badge variant="secondary">Dibaca</Badge>
          ) : (
            <Badge>Baharu</Badge>
          )}
          {/* Diakui BERBEZA daripada dibaca: melihat peringatan dos bukan
                bermakna dos sudah diberi (docs/05 §6). */}
          {row.original.acknowledgedAt ? (
            <Badge variant="outline">Diakui</Badge>
          ) : null}
        </div>
      ),
    }),
    helper.accessor("createdAt", {
      header: "Masa",
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
          {row.original.readAt ? null : (
            <TableActionButton
              aria-label={`Tandakan dibaca: ${row.original.title}`}
              onPress={() => {
                void run(inbox.markRead(row.original.id), "Ditanda dibaca.")
              }}
            >
              <IconCheck />
              Dibaca
            </TableActionButton>
          )}
          {row.original.acknowledgedAt ? null : (
            <TableActionButton
              aria-label={`Akui: ${row.original.title}`}
              onPress={() => {
                void run(inbox.acknowledge(row.original.id), "Tindakan diakui.")
              }}
            >
              <IconChecks />
              Akui
            </TableActionButton>
          )}
        </TableActions>
      ),
    }),
  ])

  return (
    <DataTable
      columns={columns}
      data={inbox.data}
      getRowId={(row) => row.id}
      isLoading={inbox.isLoading && inbox.data.length === 0}
      errorMessage={inbox.error ? messageForApiError(inbox.error) : undefined}
      onRetry={() => {
        void inbox.reload()
      }}
      searchable
      searchPlaceholder="Cari pemberitahuan..."
      pageSize={10}
      filter={{
        columnId: "status",
        label: "Status",
        options: [
          { label: "Semua", value: "all" },
          { label: "Belum dibaca", value: "baharu" },
          { label: "Sudah dibaca", value: "dibaca" },
        ],
      }}
      toolbarStart={
        <div className="space-y-1">
          <h1 className="font-heading text-2xl tracking-tight">
            Pemberitahuan
          </h1>
          <p className="text-sm text-muted-foreground">
            Amaran keselamatan, jemputan circle dan peringatan.
          </p>
        </div>
      }
      toolbarActions={
        inbox.hasMore ? (
          <Button
            variant="outline"
            size="sm"
            isDisabled={inbox.isLoading}
            onPress={() => {
              void inbox.loadMore()
            }}
          >
            Muat lagi
          </Button>
        ) : null
      }
      emptyIcon={<IconBell />}
      emptyTitle="Tiada pemberitahuan"
      emptyDescription="Amaran dan peringatan akan muncul di sini."
    />
  )
}
