"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { IconInbox, IconPlus, IconTrash } from "@tabler/icons-react"

import { AsyncStateBanner } from "@/components/care/async-state"
import {
  useCareData,
  useCareProfile,
} from "@/components/care/care-data-provider"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { createDataTableColumnHelper, DataTable } from "@/components/data-table"
import { TableActionButton, TableActions } from "@/components/table-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { usePaginatedCareResource } from "@/hooks/use-paginated-care-resource"
import { formatDateTime } from "@/lib/application/care-format"
import { getCareRepository } from "@/lib/composition/care-repository"
import { isMockDataEnabled } from "@/lib/infrastructure/config"
import {
  LOG_TYPE_OPTIONS,
  VISIBILITY_LABELS,
  type CareLog,
} from "@/lib/domain/care"
import { messageForApiError } from "@/lib/infrastructure/api/errors"

export function CareLogsPage() {
  const router = useRouter()
  const apiMode = !isMockDataEnabled()
  const { selectedProfile } = useCareProfile()
  const { snapshot, isRefreshing, deleteCareLog } = useCareData()
  const [deleteTarget, setDeleteTarget] = useState<CareLog | null>(null)

  const fetchLogs = useCallback(
    (profileId: string, params: { page?: number; perPage?: number }) =>
      getCareRepository().listCareLogs(profileId, params),
    []
  )

  const paginated = usePaginatedCareResource<CareLog>({
    profileId: selectedProfile?.id,
    enabled: apiMode,
    fetcher: fetchLogs,
    initialPerPage: 10,
  })

  const mockLogs = snapshot.logs.filter(
    (item) => item.profileId === selectedProfile?.id
  )

  const logs = apiMode ? (paginated.data?.data ?? []) : mockLogs
  const isLoading = apiMode ? paginated.isLoading : isRefreshing
  const errorMessage =
    apiMode && paginated.error ? messageForApiError(paginated.error) : undefined

  const columns = useMemo(() => {
    const helper = createDataTableColumnHelper<CareLog>()
    return helper.columns([
      helper.accessor("title", { header: "Tajuk" }),
      helper.accessor(
        (row) =>
          LOG_TYPE_OPTIONS.find((item) => item.value === row.logType)?.label ??
          row.logType,
        { id: "logType", header: "Jenis" }
      ),
      helper.accessor("body", {
        header: "Catatan",
        cell: ({ getValue }) => (
          <span className="block max-w-xs truncate">{getValue()}</span>
        ),
      }),
      helper.accessor("visibility", {
        header: "Keterlihatan",
        filterFn: "equalsString",
        enableColumnFilter: !apiMode,
        cell: ({ getValue }) => (
          <Badge variant="secondary">{VISIBILITY_LABELS[getValue()]}</Badge>
        ),
      }),
      helper.accessor("occurredAt", {
        header: "Masa",
        cell: ({ getValue }) => formatDateTime(getValue()),
      }),
      helper.accessor("createdBy", { header: "Oleh" }),
      helper.display({
        id: "actions",
        header: () => <span className="flex justify-end">Action</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <TableActions>
            <TableActionButton
              variant="destructive"
              onPress={() => setDeleteTarget(row.original)}
            >
              <IconTrash />
              Padam
            </TableActionButton>
          </TableActions>
        ),
      }),
    ])
  }, [apiMode])

  return (
    <>
      {apiMode ? (
        <AsyncStateBanner
          error={paginated.error}
          onRetry={() => {
            void paginated.reload()
          }}
        />
      ) : null}

      <DataTable
        columns={columns}
        data={logs}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        errorMessage={errorMessage}
        onRetry={() => {
          void paginated.reload()
        }}
        manualPagination={apiMode}
        pageIndex={apiMode ? paginated.page - 1 : undefined}
        pageCount={apiMode ? paginated.data?.totalPages : undefined}
        rowCount={apiMode ? paginated.data?.total : undefined}
        onPageChange={(pageIndex) => paginated.setPage(pageIndex + 1)}
        onPageSizeChange={(nextSize) => {
          paginated.setPerPage(nextSize)
          paginated.setPage(1)
        }}
        searchable={!apiMode}
        searchPlaceholder="Cari log..."
        filter={
          apiMode
            ? undefined
            : {
                columnId: "visibility",
                label: "Keterlihatan",
                options: Object.entries(VISIBILITY_LABELS).map(
                  ([value, label]) => ({
                    value,
                    label,
                  })
                ),
              }
        }
        toolbarStart={
          <div className="space-y-1">
            <h1 className="font-heading text-2xl tracking-tight">Log jagaan</h1>
            <p className="text-sm text-muted-foreground">
              Catatan berstruktur: jenis, masa kejadian, dan siapa yang boleh
              melihat.
            </p>
          </div>
        }
        toolbarActions={
          <Button onPress={() => router.push("/care-logs/new")}>
            <IconPlus />
            Tambah log
          </Button>
        }
        emptyIcon={<IconInbox />}
        emptyTitle="Tiada log lagi"
        emptyDescription="Simpan log pertama untuk profil ini."
        emptyAction={
          <Button onPress={() => router.push("/care-logs/new")}>
            <IconPlus />
            Tambah log
          </Button>
        }
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
        title="Padam log?"
        description="Log yang dipadam tidak boleh dipulihkan."
        confirmLabel="Padam"
        variant="destructive"
        onConfirm={() => {
          if (!deleteTarget) {
            return
          }
          void deleteCareLog(deleteTarget.id).then(() => {
            if (apiMode) {
              void paginated.reload()
            }
            setDeleteTarget(null)
          })
        }}
      />
    </>
  )
}
