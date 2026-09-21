"use client"

import { useState } from "react"
import { IconActivity } from "@tabler/icons-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { createDataTableColumnHelper, DataTable } from "@/components/data-table"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { AsyncStateBanner } from "@/components/shared/async-state"
import { TableActionButton, TableActions } from "@/components/table-actions"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useDisplayFormat } from "@/lib/application/display-preferences"
import { getHealthRepository } from "@/lib/composition/health-repository"
import type { VitalReading, VitalType } from "@/lib/domain/health"
import {
  ApiError,
  isApiError,
  messageForApiError,
} from "@/lib/infrastructure/api/errors"

/** Nilai lalai `<input type="datetime-local">`: sekarang, waktu tempatan pelayar. */
function nowLocalInput(now = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
}

/**
 * Bacaan vital untuk SATU person. Satu bacaan = satu snapshot pada satu masa,
 * jadi tiada kemas kini - salah catat bermakna padam dan catat semula.
 */
export function PersonVitals({
  circleId,
  personId,
  canWrite,
  vitalTypes,
  vitalReadings,
  error,
  isLoading,
  onChanged,
}: {
  circleId: string
  personId: string
  canWrite: boolean
  vitalTypes: VitalType[]
  vitalReadings: VitalReading[]
  error: ApiError | null
  isLoading: boolean
  onChanged: () => void
}) {
  const { dateTime } = useDisplayFormat()
  const repo = getHealthRepository()

  const [busy, setBusy] = useState(false)
  const [isRecordOpen, setIsRecordOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<VitalReading | null>(null)

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

  const helper = createDataTableColumnHelper<VitalReading>()
  const columns = helper.columns([
    helper.accessor("vitalTypeId", {
      id: "type",
      header: "Jenis",
      cell: ({ row }) => {
        const type = vitalTypes.find((t) => t.id === row.original.vitalTypeId)
        return (
          <div className="min-w-0 space-y-0.5">
            <p className="font-medium">
              {type?.name ?? "Jenis tidak diketahui"}
            </p>
            {type ? (
              <p className="text-xs text-muted-foreground">{type.unit}</p>
            ) : null}
          </div>
        )
      },
    }),
    helper.accessor("valuePrimary", {
      id: "value",
      header: "Nilai",
      cell: ({ row }) => {
        const type = vitalTypes.find((t) => t.id === row.original.vitalTypeId)
        return (
          <span className="tabular-nums">
            {row.original.valuePrimary}
            {row.original.valueSecondary
              ? ` / ${row.original.valueSecondary}`
              : ""}{" "}
            {type?.unit ?? ""}
          </span>
        )
      },
    }),
    helper.accessor("measuredAt", {
      header: "Bila diukur",
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{dateTime(getValue())}</span>
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
              tone="danger"
              aria-label={`Padam bacaan ${row.original.vitalTypeId}`}
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
        label="Gagal memuatkan bacaan vital."
      />

      <DataTable
        columns={columns}
        data={vitalReadings}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        pageSize={5}
        addLabel="Catat bacaan"
        onAdd={canWrite ? () => setIsRecordOpen(true) : undefined}
        toolbarStart={
          <p className="text-sm text-muted-foreground">
            Bacaan ialah snapshot: salah catat perlu dipadam dan dicatat semula.
          </p>
        }
        emptyIcon={<IconActivity />}
        emptyTitle="Tiada bacaan vital"
        emptyDescription="Tekanan darah, nadi, berat, suhu - apa sahaja yang diukur."
      />

      <RecordVitalDialog
        circleId={circleId}
        personId={personId}
        vitalTypes={vitalTypes}
        isOpen={isRecordOpen}
        onOpenChange={setIsRecordOpen}
        isSaving={busy}
        onSubmitted={() => setIsRecordOpen(false)}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
        title="Padam bacaan ini?"
        description="Snapshot tidak boleh disunting - hanya dipadam dan dicatat semula."
        confirmLabel="Padam"
        variant="destructive"
        onConfirm={() => {
          const target = deleteTarget
          setDeleteTarget(null)
          if (target) {
            void run(
              repo.deleteVitalReading(circleId, personId, target.id),
              "Bacaan dipadam."
            )
          }
        }}
      />
    </div>
  )
}

function RecordVitalDialog({
  circleId,
  personId,
  vitalTypes,
  isOpen,
  onOpenChange,
  isSaving,
  onSubmitted,
}: {
  circleId: string
  personId: string
  vitalTypes: VitalType[]
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isSaving: boolean
  onSubmitted: () => void
}) {
  const repo = getHealthRepository()
  const [typeId, setTypeId] = useState(vitalTypes[0]?.id ?? "")
  const [primary, setPrimary] = useState("")
  const [secondary, setSecondary] = useState("")
  const [measuredAt, setMeasuredAt] = useState(nowLocalInput())
  const [note, setNote] = useState("")

  const type = vitalTypes.find((t) => t.id === typeId)

  async function submit() {
    try {
      await repo.recordVitalReading(circleId, personId, {
        vitalTypeId: typeId,
        valuePrimary: primary.trim(),
        valueSecondary: secondary.trim() || undefined,
        measuredAt,
        note: note.trim() || undefined,
      })
      setTypeId(vitalTypes[0]?.id ?? "")
      setPrimary("")
      setSecondary("")
      setNote("")
      setMeasuredAt(nowLocalInput())
      toast.success("Bacaan dicatat.")
      onSubmitted()
    } catch (cause) {
      toast.error(
        isApiError(cause) ? messageForApiError(cause) : "Tindakan gagal."
      )
    }
  }

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Catat bacaan vital"
      description="Satu bacaan pada satu masa. Berat dan tinggi ialah bacaan di sini."
      footer={
        <>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            isDisabled={
              isSaving || typeId.length === 0 || primary.trim().length === 0
            }
            onPress={() => {
              void submit()
            }}
          >
            Simpan
          </Button>
        </>
      }
    >
      <Field>
        <FieldLabel>Jenis</FieldLabel>
        <Select
          className="w-full"
          aria-label="Jenis bacaan"
          value={typeId}
          onChange={(key) => {
            setTypeId(String(key ?? ""))
            setSecondary("")
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {vitalTypes.map((item) => (
              <SelectItem key={item.id} id={item.id}>
                {item.name} ({item.unit})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel htmlFor="vital-primary">
          {type ? `Nilai (${type.unit})` : "Nilai"}
        </FieldLabel>
        <Input
          id="vital-primary"
          inputMode="decimal"
          value={primary}
          placeholder="Contoh: 120"
          onChange={(event) => setPrimary(event.target.value)}
        />
        {type?.hasSecondary ? (
          <FieldDescription>
            Sistolik / diastolik - nilai kedua di bawah.
          </FieldDescription>
        ) : null}
      </Field>
      {type?.hasSecondary ? (
        <Field>
          <FieldLabel htmlFor="vital-secondary">
            Nilai kedua ({type.secondaryUnit ?? type.unit})
          </FieldLabel>
          <Input
            id="vital-secondary"
            inputMode="decimal"
            value={secondary}
            placeholder="Contoh: 80"
            onChange={(event) => setSecondary(event.target.value)}
          />
        </Field>
      ) : null}
      <Field>
        <FieldLabel htmlFor="vital-measured">Bila diukur</FieldLabel>
        <Input
          id="vital-measured"
          type="datetime-local"
          value={measuredAt}
          onChange={(event) => setMeasuredAt(event.target.value)}
        />
        <FieldDescription>Masa hadapan ditolak oleh pelayan.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="vital-note">Catatan</FieldLabel>
        <Textarea
          id="vital-note"
          rows={2}
          value={note}
          placeholder="Contoh: selepas senaman"
          onChange={(event) => setNote(event.target.value)}
        />
      </Field>
    </ResponsiveDialog>
  )
}