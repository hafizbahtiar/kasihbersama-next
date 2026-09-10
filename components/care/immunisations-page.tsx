"use client"

import { useMemo, useState } from "react"
import { IconInbox, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react"
import { toast } from "sonner"

import { AsyncStateBanner } from "@/components/care/async-state"
import { ImmunisationStatusBadge } from "@/components/care/immunisation-status-badge"
import { PageHeader } from "@/components/care/page-header"
import { PermissionGate } from "@/components/care/permission-gate"
import { RecordImmunisationDialog } from "@/components/care/record-immunisation-dialog"
import { SelectProfileEmpty } from "@/components/care/select-profile-empty"
import { useCareProfile } from "@/components/care/care-data-provider"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { createDataTableColumnHelper, DataTable } from "@/components/data-table"
import { TableActionButton, TableActions } from "@/components/table-actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { LinkButton } from "@/components/ui/button"
import { useImmunisationBook } from "@/hooks/use-immunisation-book"
import { formatDate } from "@/lib/application/care-format"
import { getGrowthRepository } from "@/lib/composition/growth-repository"
import {
  GROWTH_REQUIREMENT_MESSAGES,
  type ImmunisationItem,
} from "@/lib/domain/growth"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"

type DialogState =
  | { mode: "record"; item: ImmunisationItem }
  | {
      mode: "edit"
      item: ImmunisationItem
      recordId: string
      givenAt: string
      note?: string
    }
  | null

export function ImmunisationsPage() {
  const { selectedProfile } = useCareProfile()
  const { data: book, isLoading, error, reload } = useImmunisationBook(
    selectedProfile?.id
  )
  const [dialog, setDialog] = useState<DialogState>(null)
  const [deleteTarget, setDeleteTarget] = useState<ImmunisationItem | null>(
    null
  )
  const [isDeleting, setIsDeleting] = useState(false)

  const columns = useMemo(() => {
    const helper = createDataTableColumnHelper<ImmunisationItem>()
    return helper.columns([
      helper.accessor("vaccine", { header: "Vaksin" }),
      helper.accessor("label", { header: "Dos" }),
      helper.accessor((row) => row.dueDate ?? "—", {
        id: "dueDate",
        header: "Tarikh patut",
        cell: ({ row }) =>
          row.original.dueDate ? formatDate(row.original.dueDate) : "—",
      }),
      helper.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => (
          <ImmunisationStatusBadge value={getValue()} />
        ),
      }),
      helper.accessor(
        (row) => row.record?.givenAt ?? "—",
        {
          id: "givenAt",
          header: "Tarikh diberi",
          cell: ({ row }) =>
            row.original.record?.givenAt
              ? formatDate(row.original.record.givenAt)
              : "—",
        }
      ),
      helper.accessor(
        (row) => row.record?.note ?? row.regionNote ?? "—",
        {
          id: "note",
          header: "Nota",
          cell: ({ getValue }) => (
            <span className="block max-w-xs truncate text-muted-foreground">
              {getValue()}
            </span>
          ),
        }
      ),
      helper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const item = row.original
          if (item.status === "not_applicable") {
            return null
          }
          return (
            <TableActions>
              {item.status === "given" && item.record ? (
                <PermissionGate permission="can_edit_medication_setup">
                  <TableActionButton
                    aria-label={`Sunting ${item.vaccine}`}
                    onPress={() =>
                      setDialog({
                        mode: "edit",
                        item,
                        recordId: item.record!.id,
                        givenAt: item.record!.givenAt,
                        note: item.record!.note,
                      })
                    }
                  >
                    <IconPencil />
                    Sunting
                  </TableActionButton>
                  <TableActionButton
                    aria-label={`Padam ${item.vaccine}`}
                    onPress={() => setDeleteTarget(item)}
                  >
                    <IconTrash />
                    Padam
                  </TableActionButton>
                </PermissionGate>
              ) : (
                <PermissionGate permission="can_edit_medication_setup">
                  <TableActionButton
                    aria-label={`Rekod ${item.vaccine}`}
                    onPress={() => setDialog({ mode: "record", item })}
                  >
                    <IconPlus />
                    Rekod
                  </TableActionButton>
                </PermissionGate>
              )}
            </TableActions>
          )
        },
      }),
    ])
  }, [])

  if (!selectedProfile) {
    return <SelectProfileEmpty />
  }

  async function confirmDelete() {
    if (!selectedProfile || !deleteTarget?.record) {
      return
    }
    setIsDeleting(true)
    try {
      await getGrowthRepository().deleteImmunisation(
        selectedProfile.id,
        deleteTarget.record.id
      )
      toast.success("Rekod imunisasi dipadam.")
      setDeleteTarget(null)
      await reload()
    } catch (cause) {
      toast.error(
        isApiError(cause) ? messageForApiError(cause) : "Gagal memadam rekod."
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const visibleItems =
    book?.items.filter((item) => item.status !== "not_applicable") ?? []

  return (
    <div className="flex flex-col gap-5">
      <AsyncStateBanner error={error} onRetry={() => void reload()} />

      <PageHeader
        title="Imunisasi"
        description="Buku imunisasi kebangsaan (NIP). Dos patut dikira dari tarikh lahir profil."
        meta={
          book?.scheduleVersion ? (
            <Badge variant="secondary">Jadual {book.scheduleVersion}</Badge>
          ) : null
        }
      />

      {book && !book.ready ? (
        <Alert>
          <AlertTitle>Lengkapkan profil dahulu</AlertTitle>
          <AlertDescription className="space-y-2">
            {book.missing.map((key) => (
              <p key={key}>{GROWTH_REQUIREMENT_MESSAGES[key]}</p>
            ))}
            <LinkButton href={`/care-profiles/${selectedProfile.id}/edit`}>
              Sunting profil
            </LinkButton>
          </AlertDescription>
        </Alert>
      ) : null}

      <DataTable
        columns={columns}
        data={visibleItems}
        getRowId={(row) => row.scheduleDoseId}
        isLoading={isLoading}
        paginate={false}
        emptyIcon={<IconInbox />}
        emptyTitle="Tiada dos dalam jadual"
        emptyDescription="Pilih profil kanak-kanak dengan tarikh lahir dan jantina."
      />

      {dialog ? (
        <RecordImmunisationDialog
          profileId={selectedProfile.id}
          item={dialog.item}
          open
          onOpenChange={(open) => {
            if (!open) {
              setDialog(null)
            }
          }}
          mode={dialog.mode}
          recordId={dialog.mode === "edit" ? dialog.recordId : undefined}
          initialGivenAt={dialog.mode === "edit" ? dialog.givenAt : undefined}
          initialNote={dialog.mode === "edit" ? dialog.note : undefined}
          onSaved={() => void reload()}
        />
      ) : null}

      <ConfirmDialog
        isOpen={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
        title="Padam rekod imunisasi?"
        description={
          deleteTarget
            ? `${deleteTarget.vaccine} — ${deleteTarget.label} pada ${
                deleteTarget.record?.givenAt
                  ? formatDate(deleteTarget.record.givenAt)
                  : "—"
              }. Dos akan kembali ke status menunggu atau lewat.`
            : "Rekod ini akan dipadam."
        }
        confirmLabel={isDeleting ? "Memadam…" : "Padam"}
        variant="destructive"
        onConfirm={() => {
          void confirmDelete()
        }}
      />
    </div>
  )
}
