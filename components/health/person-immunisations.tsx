"use client"

import { useState } from "react"
import { IconVaccine } from "@tabler/icons-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { createDataTableColumnHelper, DataTable } from "@/components/data-table"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { StatusChip } from "@/components/status-chip"
import { AsyncStateBanner } from "@/components/shared/async-state"
import { TableActionButton, TableActions } from "@/components/table-actions"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useDisplayFormat } from "@/lib/application/display-preferences"
import { getHealthRepository } from "@/lib/composition/health-repository"
import { todayISO, type Immunisation } from "@/lib/domain/health"
import {
  ApiError,
  isApiError,
  messageForApiError,
} from "@/lib/infrastructure/api/errors"

/**
 * Imunisasi untuk SATU person. `givenOn` kosong bermakna "belum diberi" - satu
 * suntikan berjadual. `nextDueOn` ialah tarikh dos berikutnya (jika ada).
 */
export function PersonImmunisations({
  circleId,
  personId,
  canWrite,
  immunisations,
  error,
  isLoading,
  onChanged,
}: {
  circleId: string
  personId: string
  canWrite: boolean
  immunisations: Immunisation[]
  error: ApiError | null
  isLoading: boolean
  onChanged: () => void
}) {
  const { date } = useDisplayFormat()
  const repo = getHealthRepository()

  const [busy, setBusy] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [editingTarget, setEditingTarget] = useState<Immunisation | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Immunisation | null>(null)

  async function run(action: Promise<unknown>, done: string) {
    setBusy(true)
    try {
      await action
      toast.success(done)
      onChanged()
    } catch (cause) {
      toast.error(
        isApiError(cause) ? messageForApiError(cause) : "Tindakan gagal."
      )
    } finally {
      setBusy(false)
    }
  }

  const helper = createDataTableColumnHelper<Immunisation>()
  const columns = helper.columns([
    helper.accessor("vaccine", {
      header: "Vaksin",
      cell: ({ row }) => (
        <div className="min-w-0 space-y-0.5">
          <p className="font-medium">{row.original.vaccine}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.batchNo ? `Kelompok ${row.original.batchNo}` : ""}
          </p>
        </div>
      ),
    }),
    helper.accessor("doseNumber", {
      header: "Dos",
      cell: ({ getValue }) => (
        <span className="tabular-nums">{getValue() ?? "-"}</span>
      ),
    }),
    helper.accessor("givenOn", {
      id: "status",
      header: "Diberi",
      filterFn: "equalsString",
      cell: ({ getValue }) =>
        getValue() ? (
          <StatusChip tone="positive" label={date(getValue()!)} />
        ) : (
          <StatusChip tone="attention" label="Belum" />
        ),
    }),
    helper.accessor("nextDueOn", {
      header: "Seterusnya",
      cell: ({ getValue }) =>
        getValue() ? (
          <span className="text-muted-foreground">{date(getValue()!)}</span>
        ) : (
          <span className="text-muted-foreground">Tiada</span>
        ),
    }),
    helper.display({
      id: "action",
      header: () => <span className="flex justify-end">Tindakan</span>,
      enableSorting: false,
      cell: ({ row }) =>
        canWrite ? (
          <TableActions>
            <TableActionButton
              isDisabled={busy}
              onPress={() => setEditingTarget(row.original)}
            >
              Sunting
            </TableActionButton>
            <TableActionButton
              tone="danger"
              aria-label={`Padam ${row.original.vaccine}`}
              isDisabled={busy}
              onPress={() => setDeleteTarget(row.original)}
            >
              Padam
            </TableActionButton>
          </TableActions>
        ) : null,
    }),
  ])

  return (
    <div className="flex flex-col gap-4">
      <AsyncStateBanner
        error={error}
        onRetry={onChanged}
        label="Gagal memuatkan imunisasi."
      />

      <DataTable
        columns={columns}
        data={immunisations}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        pageSize={5}
        addLabel="Rekod imunisasi"
        onAdd={canWrite ? () => setIsOpen(true) : undefined}
        toolbarStart={
          <p className="text-sm text-muted-foreground">
            Satu baris = satu dos vaksin. Belum diberi bermakna berjadual
            sahaja.
          </p>
        }
        emptyIcon={<IconVaccine />}
        emptyTitle="Tiada imunisasi"
        emptyDescription="Vaksin yang diberikan atau dijadualkan."
      />

      <ImmunisationDialog
        key={editingTarget?.id ?? "new"}
        initial={editingTarget}
        isOpen={isOpen || Boolean(editingTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingTarget(null)
            setIsOpen(false)
          }
        }}
        onSubmit={(input) =>
          run(
            (editingTarget
              ? repo.updateImmunisation(circleId, personId, editingTarget.id, input)
              : repo.createImmunisation(circleId, personId, input)
            ).then(() => {
              setEditingTarget(null)
              setIsOpen(false)
            }),
            editingTarget
              ? "Imunisasi dikemas kini."
              : "Imunisasi direkodkan."
          )
        }
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
        title="Padam imunisasi ini?"
        description={`${deleteTarget?.vaccine ?? "Imunisasi"} dibuang daripada rekod. Sejarah vaksinasi sukar dipulihkan.`}
        confirmLabel="Padam"
        variant="destructive"
        onConfirm={() => {
          const target = deleteTarget
          setDeleteTarget(null)
          if (target) {
            void run(
              repo.deleteImmunisation(circleId, personId, target.id),
              "Imunisasi dipadam."
            )
          }
        }}
      />
    </div>
  )
}

function ImmunisationDialog({
  initial,
  isOpen,
  onOpenChange,
  onSubmit,
}: {
  initial: Immunisation | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: {
    vaccine: string
    doseNumber?: number
    givenOn?: string
    batchNo?: string
    nextDueOn?: string
    notes?: string
  }) => void
}) {
  const [vaccine, setVaccine] = useState(initial?.vaccine ?? "")
  const [dose, setDose] = useState(
    initial?.doseNumber != null ? String(initial.doseNumber) : ""
  )
  const [givenOn, setGivenOn] = useState(initial?.givenOn ?? "")
  const [batchNo, setBatchNo] = useState(initial?.batchNo ?? "")
  const [nextDueOn, setNextDueOn] = useState(initial?.nextDueOn ?? "")
  const [notes, setNotes] = useState(initial?.notes ?? "")

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={initial ? "Sunting imunisasi" : "Rekod imunisasi"}
      description={
        initial
          ? "Kosongkan tarikh untuk membuangnya."
          : "Suntikan berjadual boleh direkod dahulu - Diberi diisi kemudian."
      }
      footer={
        <>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            isDisabled={vaccine.trim().length === 0}
            onPress={() => {
              onSubmit({
                vaccine: vaccine.trim(),
                doseNumber: dose.trim() ? Number(dose.trim()) : undefined,
                givenOn: givenOn || "",
                batchNo: batchNo.trim() || "",
                nextDueOn: nextDueOn || "",
                notes: notes.trim() || "",
              })
            }}
          >
            Simpan
          </Button>
        </>
      }
    >
      <Field>
        <FieldLabel htmlFor="immunisation-vaccine">Vaksin</FieldLabel>
        <Input
          id="immunisation-vaccine"
          value={vaccine}
          placeholder="Contoh: BCG"
          onChange={(event) => setVaccine(event.target.value)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel htmlFor="immunisation-dose">Dos</FieldLabel>
          <Input
            id="immunisation-dose"
            type="number"
            min={1}
            max={100}
            value={dose}
            placeholder="1"
            onChange={(event) => setDose(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="immunisation-batch">No. kelompok</FieldLabel>
          <Input
            id="immunisation-batch"
            value={batchNo}
            placeholder="Contoh: KM123"
            onChange={(event) => setBatchNo(event.target.value)}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel htmlFor="immunisation-given">Diberi pada</FieldLabel>
          <Input
            id="immunisation-given"
            type="date"
            max={todayISO()}
            value={givenOn}
            onChange={(event) => setGivenOn(event.target.value)}
          />
          <FieldDescription>Kosongkan jika belum diberi.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="immunisation-next">Seterusnya oleh</FieldLabel>
          <Input
            id="immunisation-next"
            type="date"
            value={nextDueOn}
            onChange={(event) => setNextDueOn(event.target.value)}
          />
        </Field>
      </div>
      <Field>
        <FieldLabel htmlFor="immunisation-notes">Catatan</FieldLabel>
        <Textarea
          id="immunisation-notes"
          rows={2}
          value={notes}
          placeholder="Contoh: tindak balas ringan selepas suntikan"
          onChange={(event) => setNotes(event.target.value)}
        />
      </Field>
    </ResponsiveDialog>
  )
}