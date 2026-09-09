"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  IconDownload,
  IconInbox,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { AsyncStateBanner } from "@/components/care/async-state"
import { ConfirmDialog } from "@/components/confirm-dialog"
import {
  useCareData,
  useCareProfile,
} from "@/components/care/care-data-provider"
import { PermissionGate } from "@/components/care/permission-gate"
import { usePlatform } from "@/components/platform/platform-provider"
import { createDataTableColumnHelper, DataTable } from "@/components/data-table"
import { TableActionButton, TableActions } from "@/components/table-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress"
import { usePaginatedCareResource } from "@/hooks/use-paginated-care-resource"
import { formatFileSize } from "@/lib/application/care-format"
import { getCareRepository } from "@/lib/composition/care-repository"
import { isMockDataEnabled } from "@/lib/infrastructure/config"
import {
  DOCUMENT_TYPE_LABELS,
  UPLOAD_STATE_LABELS,
  type CareDocument,
} from "@/lib/domain/care"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"

export function DocumentsPage() {
  const router = useRouter()
  const apiMode = !isMockDataEnabled()
  const { accountLimits } = usePlatform()
  const { selectedProfile } = useCareProfile()
  const { snapshot, isRefreshing, removeDocument, getDocumentDownloadUrl } =
    useCareData()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchDocuments = useMemo(
    () => (profileId: string, params: { page?: number; perPage?: number }) =>
      getCareRepository().listDocuments(profileId, params),
    []
  )

  const paginated = usePaginatedCareResource<CareDocument>({
    profileId: selectedProfile?.id,
    enabled: apiMode,
    fetcher: fetchDocuments,
    initialPerPage: 10,
  })

  const mockDocuments = snapshot.documents.filter(
    (item) => item.profileId === selectedProfile?.id
  )
  const documents = apiMode ? (paginated.data?.data ?? []) : mockDocuments
  const isLoading = apiMode ? paginated.isLoading : isRefreshing
  const errorMessage =
    apiMode && paginated.error ? messageForApiError(paginated.error) : undefined

  const columns = useMemo(() => {
    const helper = createDataTableColumnHelper<CareDocument>()
    return helper.columns([
      helper.accessor("title", { header: "Tajuk" }),
      helper.accessor("documentType", {
        header: "Jenis",
        filterFn: "equalsString",
        enableColumnFilter: !apiMode,
        cell: ({ getValue }) => DOCUMENT_TYPE_LABELS[getValue()],
      }),
      helper.accessor("filename", {
        header: "Fail",
        cell: ({ getValue }) => (
          <span className="block max-w-[12rem] truncate">{getValue()}</span>
        ),
      }),
      helper.accessor("sizeBytes", {
        header: "Saiz",
        cell: ({ getValue }) => formatFileSize(getValue()),
      }),
      helper.accessor("uploadState", {
        header: "Muat naik",
        cell: ({ row }) =>
          row.original.uploadState === "uploading" ? (
            <Progress
              value={row.original.uploadProgress}
              minValue={0}
              maxValue={100}
              className="w-36"
            >
              <ProgressLabel className="sr-only">Memuat naik</ProgressLabel>
              <ProgressValue />
            </Progress>
          ) : (
            <Badge
              variant={
                row.original.uploadState === "done" ? "default" : "secondary"
              }
            >
              {UPLOAD_STATE_LABELS[row.original.uploadState]}
            </Badge>
          ),
      }),
      helper.display({
        id: "action",
        header: () => <span className="flex justify-end">Action</span>,
        enableSorting: false,
        enableGlobalFilter: false,
        enableColumnFilter: false,
        cell: ({ row }) => (
          <TableActions>
            <TableActionButton
              onPress={() => {
                void getDocumentDownloadUrl(row.original.id)
                  .then(({ url, filename }) => {
                    if (url === "#") {
                      toast.message("Muat turun demo (mock).")
                      return
                    }
                    window.open(url, "_blank", "noopener,noreferrer")
                    toast.success(`Memuat turun ${filename}.`)
                  })
                  .catch((error) => {
                    toast.error(
                      isApiError(error)
                        ? messageForApiError(error)
                        : "Muat turun gagal."
                    )
                  })
              }}
            >
              <IconDownload />
              Muat turun
            </TableActionButton>
            <PermissionGate permission="can_upload_documents">
              <TableActionButton
                variant="destructive"
                onPress={() => setDeleteId(row.original.id)}
              >
                <IconTrash />
                Padam
              </TableActionButton>
            </PermissionGate>
          </TableActions>
        ),
      }),
    ])
  }, [apiMode, getDocumentDownloadUrl])

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
        data={documents}
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
        searchPlaceholder="Cari dokumen..."
        filter={
          apiMode
            ? undefined
            : {
                columnId: "documentType",
                label: "Jenis",
                options: Object.entries(DOCUMENT_TYPE_LABELS).map(
                  ([value, label]) => ({ value, label })
                ),
              }
        }
        toolbarStart={
          <div className="space-y-1">
            <h1 className="font-heading text-2xl tracking-tight">Dokumen</h1>
            <p className="text-sm text-muted-foreground">
              Fail penting profil ini. Had {accountLimits.maxUploadMb} MB setiap satu.
            </p>
          </div>
        }
        toolbarActions={
          <PermissionGate
            feature="document_upload"
            permission="can_upload_documents"
          >
            <Button onPress={() => router.push("/documents/new")}>
              <IconPlus />
              Muat naik
            </Button>
          </PermissionGate>
        }
        emptyIcon={<IconInbox />}
        emptyTitle="Tiada dokumen lagi"
        emptyDescription="Muat naik fail pertama untuk profil ini."
        emptyAction={
          <PermissionGate
            feature="document_upload"
            permission="can_upload_documents"
          >
            <Button onPress={() => router.push("/documents/new")}>
              <IconPlus />
              Muat naik
            </Button>
          </PermissionGate>
        }
      />

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteId(null)
          }
        }}
        title="Padam dokumen?"
        description="Fail dibuang daripada profil ini dan dipadam dari storan. Tindakan ini kekal."
        confirmLabel="Padam"
        variant="destructive"
        onConfirm={() => {
          if (!deleteId) {
            return
          }
          void removeDocument(deleteId).then(() => {
            if (apiMode) {
              void paginated.reload()
            }
            setDeleteId(null)
          })
        }}
      />
    </>
  )
}
