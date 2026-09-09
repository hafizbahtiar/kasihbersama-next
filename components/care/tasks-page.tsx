"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { IconInbox, IconPlus } from "@tabler/icons-react"

import { AsyncStateBanner } from "@/components/care/async-state"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { TaskStatusBadge } from "@/components/care/status-badges"
import {
  useCareData,
  useCareProfile,
} from "@/components/care/care-data-provider"
import { createDataTableColumnHelper, DataTable } from "@/components/data-table"
import { TableActionButton, TableActions } from "@/components/table-actions"
import { Button } from "@/components/ui/button"
import { usePaginatedCareResource } from "@/hooks/use-paginated-care-resource"
import { formatDateTime } from "@/lib/application/care-format"
import { getCareRepository } from "@/lib/composition/care-repository"
import { isMockDataEnabled } from "@/lib/infrastructure/config"
import { TASK_STATUS_LABELS, type CareTask } from "@/lib/domain/care"
import { messageForApiError } from "@/lib/infrastructure/api/errors"

export function TasksPage() {
  const router = useRouter()
  const apiMode = !isMockDataEnabled()
  const { selectedProfile } = useCareProfile()
  const { snapshot, isRefreshing, updateTaskStatus } = useCareData()
  const [cancelTaskId, setCancelTaskId] = useState<string | null>(null)

  const fetchTasks = useMemo(
    () => (profileId: string, params: { page?: number; perPage?: number }) =>
      getCareRepository().listTasks(profileId, params),
    []
  )

  const paginated = usePaginatedCareResource<CareTask>({
    profileId: selectedProfile?.id,
    enabled: apiMode,
    fetcher: fetchTasks,
    initialPerPage: 10,
  })

  const mockTasks = snapshot.tasks.filter(
    (item) => item.profileId === selectedProfile?.id
  )
  const tasks = apiMode ? (paginated.data?.data ?? []) : mockTasks
  const isLoading = apiMode ? paginated.isLoading : isRefreshing
  const errorMessage =
    apiMode && paginated.error ? messageForApiError(paginated.error) : undefined

  const columns = useMemo(() => {
    const helper = createDataTableColumnHelper<CareTask>()
    return helper.columns([
      helper.accessor("title", { header: "Tajuk" }),
      helper.accessor("description", {
        header: "Huraian",
        cell: ({ getValue }) => (
          <span className="block max-w-xs truncate">{getValue()}</span>
        ),
      }),
      helper.accessor((row) => row.assignedToName ?? "Belum ditugaskan", {
        id: "assignee",
        header: "Ditugaskan",
      }),
      helper.accessor("dueAt", {
        header: "Masa akhir",
        cell: ({ getValue }) => formatDateTime(getValue()),
      }),
      helper.accessor("status", {
        header: "Status",
        filterFn: "equalsString",
        enableColumnFilter: !apiMode,
        cell: ({ getValue }) => <TaskStatusBadge value={getValue()} />,
      }),
      helper.display({
        id: "action",
        header: () => <span className="flex justify-end">Action</span>,
        enableSorting: false,
        enableGlobalFilter: false,
        enableColumnFilter: false,
        cell: ({ row }) => (
          <TableActions>
            {row.original.status === "open" ? (
              <TableActionButton
                onPress={() =>
                  void updateTaskStatus(row.original.id, "in_progress")
                }
              >
                Mula
              </TableActionButton>
            ) : null}
            {row.original.status === "open" ||
            row.original.status === "in_progress" ? (
              <>
                <TableActionButton
                  onPress={() =>
                    void updateTaskStatus(row.original.id, "completed")
                  }
                >
                  Selesai
                </TableActionButton>
                <TableActionButton
                  variant="destructive"
                  onPress={() => setCancelTaskId(row.original.id)}
                >
                  Batal
                </TableActionButton>
              </>
            ) : null}
          </TableActions>
        ),
      }),
    ])
  }, [apiMode, updateTaskStatus])

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
        data={tasks}
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
        searchPlaceholder="Cari tugasan..."
        filter={
          apiMode
            ? undefined
            : {
                columnId: "status",
                label: "Status",
                options: Object.entries(TASK_STATUS_LABELS).map(
                  ([value, label]) => ({ value, label })
                ),
              }
        }
        toolbarStart={
          <div className="space-y-1">
            <h1 className="font-heading text-2xl tracking-tight">Tugasan</h1>
            <p className="text-sm text-muted-foreground">
              Huraian, tugasan kepada ahli, masa akhir, dan alur selesai.
            </p>
          </div>
        }
        toolbarActions={
          <Button onPress={() => router.push("/tasks/new")}>
            <IconPlus />
            Tambah tugasan
          </Button>
        }
        emptyIcon={<IconInbox />}
        emptyTitle="Tiada tugasan lagi"
        emptyDescription="Cipta tugasan pertama untuk profil ini."
        emptyAction={
          <Button onPress={() => router.push("/tasks/new")}>
            <IconPlus />
            Tambah tugasan
          </Button>
        }
      />

      <ConfirmDialog
        isOpen={Boolean(cancelTaskId)}
        onOpenChange={(open) => {
          if (!open) {
            setCancelTaskId(null)
          }
        }}
        title="Batalkan tugasan?"
        description="Tugasan akan ditandakan batal dan tidak lagi dipaparkan sebagai aktif."
        confirmLabel="Batalkan tugasan"
        variant="destructive"
        onConfirm={() => {
          if (cancelTaskId) {
            void updateTaskStatus(cancelTaskId, "cancelled").then(() => {
              if (apiMode) {
                void paginated.reload()
              }
              setCancelTaskId(null)
            })
          }
        }}
      />
    </>
  )
}
