"use client"

import { useState } from "react"
import { IconPencil, IconRepeat } from "@tabler/icons-react"
import { toast } from "sonner"

import { CaregiverSelect } from "@/components/care/person-shifts"
import { createDataTableColumnHelper, DataTable } from "@/components/data-table"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { StatusChip } from "@/components/status-chip"
import { AsyncStateBanner } from "@/components/shared/async-state"
import { TableActionButton, TableActions } from "@/components/table-actions"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useCirclePersons } from "@/hooks/use-circle-persons"
import { usePersonRotas } from "@/hooks/use-person-rotas"
import { useDisplayFormat } from "@/lib/application/display-preferences"
import { getCareRepository } from "@/lib/composition/care-repository"
import type { CirclePerson } from "@/lib/domain/circle"
import {
  WEEKDAY_SHORT,
  type CareRota,
  type CareRotaInput,
} from "@/lib/domain/care"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7]

function daysLabel(days: number[]) {
  if (days.length === 0 || days.length === 7) return "Setiap hari"
  return [...days]
    .sort()
    .map((d) => WEEKDAY_SHORT[d])
    .join(", ")
}

/** "YYYY-MM-DD" hari ini, waktu pelayar - nilai lalai `<input type="date">`. */
function todayInput() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Jadual giliran berulang - "Adik jaga mak setiap Isnin-Rabu". Setiap jadual
 * mengisi senarai giliran beberapa hari ke depan dengan sendirinya. Jadual
 * yang tidak lagi dipakai dihentikan, bukan dipadam.
 */
export function PersonRotas({
  circleId,
  personId,
  canWrite,
  onChanged,
}: {
  circleId: string
  personId: string
  /** `care.rota.create` */
  canWrite: boolean
  /** Giliran dijana/dibuang oleh pelayan - senarai giliran perlu dimuat semula. */
  onChanged: () => void
}) {
  const { date } = useDisplayFormat()
  const { rotas, isLoading, error, reload } = usePersonRotas(circleId, personId)
  const persons = useCirclePersons(circleId, canWrite)
  const caregivers = persons.data.filter((p) => p.id !== personId)
  const repo = getCareRepository()

  const [busy, setBusy] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<CareRota | null>(null)

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
      await reload()
    }
  }

  const helper = createDataTableColumnHelper<CareRota>()
  const columns = helper.columns([
    helper.accessor("caregiverName", {
      header: "Penjaga",
      cell: ({ row }) => (
        <div className="min-w-0 space-y-0.5">
          <p className="font-medium">{row.original.caregiverName}</p>
          {row.original.note ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {row.original.note}
            </p>
          ) : null}
        </div>
      ),
    }),
    helper.accessor((row) => daysLabel(row.daysOfWeek), {
      id: "days",
      header: "Hari",
    }),
    helper.accessor((row) => `${row.startsTime}-${row.endsTime}`, {
      id: "time",
      header: "Masa",
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {row.original.startsTime}-{row.original.endsTime}
          {row.original.endsTime <= row.original.startsTime ? (
            <span className="text-xs text-muted-foreground"> (esoknya)</span>
          ) : null}
        </span>
      ),
    }),
    helper.accessor("startsOn", {
      header: "Tempoh",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {date(row.original.startsOn)} -{" "}
          {row.original.endsOn
            ? date(row.original.endsOn)
            : "tiada tarikh tamat"}
        </span>
      ),
    }),
    helper.accessor((row) => (row.isActive ? "aktif" : "henti"), {
      id: "status",
      header: "Status",
      filterFn: "equalsString",
      cell: ({ row }) => (
        <StatusChip
          tone={row.original.isActive ? "positive" : "neutral"}
          label={row.original.isActive ? "Aktif" : "Dihentikan"}
        />
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
              onPress={() => {
                setEditTarget(row.original)
                setIsFormOpen(true)
              }}
            >
              <IconPencil />
              Sunting
            </TableActionButton>
            <TableActionButton
              isDisabled={busy}
              onPress={() =>
                void run(
                  repo.updateRota(circleId, personId, row.original.id, {
                    isActive: !row.original.isActive,
                  }),
                  row.original.isActive
                    ? "Jadual dihentikan."
                    : "Jadual diaktifkan semula."
                )
              }
            >
              {row.original.isActive ? "Hentikan" : "Aktifkan"}
            </TableActionButton>
          </TableActions>
        ) : null,
    }),
  ])

  return (
    <div className="flex flex-col gap-4">
      <AsyncStateBanner
        error={error}
        onRetry={() => void reload()}
        label="Gagal memuatkan jadual giliran."
      />

      <DataTable
        columns={columns}
        data={rotas}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        pageSize={5}
        addLabel="Tetapkan jadual"
        onAdd={
          canWrite && !error
            ? () => {
                setEditTarget(null)
                setIsFormOpen(true)
              }
            : undefined
        }
        toolbarStart={
          <p className="text-sm text-muted-foreground">
            Jadual tetap mengisi giliran seminggu ke depan dengan sendirinya.
          </p>
        }
        emptyIcon={<IconRepeat />}
        emptyTitle="Tiada jadual tetap"
        emptyDescription="Contoh: Adik jaga setiap Isnin hingga Rabu, 8 pagi hingga 6 petang."
      />

      <RotaDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        isSaving={busy}
        target={editTarget}
        caregivers={caregivers}
        onSubmit={(input) =>
          void run(
            (editTarget
              ? repo.updateRota(circleId, personId, editTarget.id, input)
              : repo.createRota(circleId, personId, input)
            ).then(() => setIsFormOpen(false)),
            editTarget
              ? "Jadual disunting. Giliran akan datang dikemas kini."
              : "Jadual ditetapkan. Giliran seminggu ke depan telah diisi."
          )
        }
      />
    </div>
  )
}

function RotaDialog({
  isOpen,
  onOpenChange,
  isSaving,
  target,
  caregivers,
  onSubmit,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isSaving: boolean
  target: CareRota | null
  caregivers: CirclePerson[]
  onSubmit: (input: CareRotaInput) => void
}) {
  const [caregiverPersonId, setCaregiverPersonId] = useState("")
  const [days, setDays] = useState<number[]>([])
  const [startsTime, setStartsTime] = useState("08:00")
  const [endsTime, setEndsTime] = useState("18:00")
  const [startsOn, setStartsOn] = useState(todayInput())
  const [endsOn, setEndsOn] = useState("")
  const [note, setNote] = useState("")

  const isValid =
    caregiverPersonId !== "" &&
    /^\d{2}:\d{2}$/.test(startsTime) &&
    /^\d{2}:\d{2}$/.test(endsTime) &&
    startsTime !== endsTime &&
    startsOn !== "" &&
    (endsOn === "" || endsOn >= startsOn)

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (open) {
          setCaregiverPersonId(target?.caregiverPersonId ?? "")
          setDays(target?.daysOfWeek ?? [])
          setStartsTime(target?.startsTime ?? "08:00")
          setEndsTime(target?.endsTime ?? "18:00")
          setStartsOn(target?.startsOn ?? todayInput())
          setEndsOn(target?.endsOn ?? "")
          setNote(target?.note ?? "")
        }
        onOpenChange(open)
      }}
      title={target ? "Sunting jadual" : "Tetapkan jadual giliran"}
      description="Siapa jaga, hari apa, pukul berapa. Giliran diisi seminggu ke depan."
      footer={
        <>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            isDisabled={isSaving || !isValid}
            onPress={() =>
              onSubmit({
                caregiverPersonId,
                daysOfWeek: days,
                startsTime,
                endsTime,
                startsOn,
                endsOn,
                note: note.trim(),
              })
            }
          >
            Simpan
          </Button>
        </>
      }
    >
      <Field>
        <FieldLabel>Penjaga</FieldLabel>
        <CaregiverSelect
          caregivers={caregivers}
          value={caregiverPersonId}
          onChange={setCaregiverPersonId}
        />
      </Field>
      <Field>
        <FieldLabel>Hari</FieldLabel>
        <div className="flex flex-wrap gap-3">
          {WEEKDAYS.map((d) => (
            <Field
              key={d}
              orientation="horizontal"
              className="w-auto items-center"
            >
              <Checkbox
                id={`rota-day-${d}`}
                isSelected={days.includes(d)}
                onChange={(selected) =>
                  setDays(selected ? [...days, d] : days.filter((x) => x !== d))
                }
              />
              <FieldLabel htmlFor={`rota-day-${d}`} className="font-normal">
                {WEEKDAY_SHORT[d]}
              </FieldLabel>
            </Field>
          ))}
        </div>
        <FieldDescription>
          Tiada yang ditanda bermakna setiap hari.
        </FieldDescription>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel htmlFor="rota-start">Dari pukul</FieldLabel>
          <Input
            id="rota-start"
            type="time"
            value={startsTime}
            onChange={(event) => setStartsTime(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="rota-end">Hingga pukul</FieldLabel>
          <Input
            id="rota-end"
            type="time"
            value={endsTime}
            onChange={(event) => setEndsTime(event.target.value)}
          />
        </Field>
      </div>
      {endsTime !== "" && endsTime <= startsTime ? (
        <p className="text-sm text-muted-foreground">
          {endsTime === startsTime
            ? "Masa mula dan tamat mesti berbeza."
            : "Giliran malam: tamat esoknya."}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel htmlFor="rota-from">Bermula</FieldLabel>
          <Input
            id="rota-from"
            type="date"
            value={startsOn}
            onChange={(event) => setStartsOn(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="rota-until">Hingga (pilihan)</FieldLabel>
          <Input
            id="rota-until"
            type="date"
            value={endsOn}
            aria-invalid={endsOn !== "" && endsOn < startsOn}
            onChange={(event) => setEndsOn(event.target.value)}
          />
        </Field>
      </div>
      <Field>
        <FieldLabel htmlFor="rota-note">Nota</FieldLabel>
        <Textarea
          id="rota-note"
          rows={2}
          value={note}
          placeholder="Contoh: ubat pukul 1 tengah hari"
          onChange={(event) => setNote(event.target.value)}
        />
        <FieldDescription>
          Disalin ke setiap giliran yang dijana.
        </FieldDescription>
      </Field>
    </ResponsiveDialog>
  )
}
