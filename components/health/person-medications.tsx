"use client"

import { useCallback, useEffect, useState } from "react"
import { IconPill } from "@tabler/icons-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useDisplayFormat } from "@/lib/application/display-preferences"
import { getHealthRepository } from "@/lib/composition/health-repository"
import {
  MEDICATION_FORM_LABELS,
  MEDICATION_FORMS,
  WEEKDAYS,
  type HealthMedication,
  type HealthSchedule,
  type MedicationForm,
} from "@/lib/domain/health"
import {
  ApiError,
  isApiError,
  messageForApiError,
} from "@/lib/infrastructure/api/errors"

/**
 * Ubat untuk SATU person: jadual dos diuruskan pada ubat, dan dos yang terhasil
 * muncul dalam tab Dos.
 *
 * Data datang daripada induk (`person-health.tsx`) yang memuatkan seluruh rekod
 * kesihatan sekali gus - memanggil `usePersonHealth` dua kali bermakna dua muat
 * turun yang sama.
 */
export function PersonMedications({
  circleId,
  personId,
  canWrite,
  medications,
  error,
  isLoading,
  onChanged,
}: {
  circleId: string
  personId: string
  canWrite: boolean
  medications: HealthMedication[]
  error: ApiError | null
  isLoading: boolean
  onChanged: () => void
}) {
  const { date } = useDisplayFormat()
  const repo = getHealthRepository()

  const [busy, setBusy] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<HealthMedication | null>(null)
  const [scheduleMedication, setScheduleMedication] =
    useState<HealthMedication | null>(null)

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

  const helper = createDataTableColumnHelper<HealthMedication>()
  const columns = helper.columns([
    helper.accessor("name", {
      header: "Ubat",
      cell: ({ row }) => (
        <div className="min-w-0 space-y-0.5">
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.strength ? `${row.original.strength} - ` : ""}
            {MEDICATION_FORM_LABELS[row.original.form]}
          </p>
        </div>
      ),
    }),
    helper.accessor("startedOn", {
      header: "Mula",
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{date(getValue())}</span>
      ),
    }),
    helper.accessor("isActive", {
      id: "status",
      header: "Status",
      filterFn: "equalsString",
      cell: ({ getValue }) =>
        getValue() ? (
          <StatusChip tone="positive" label="Aktif" />
        ) : (
          <StatusChip tone="neutral" label="Tamat" />
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
              onPress={() => setScheduleMedication(row.original)}
            >
              Jadual
            </TableActionButton>
            <TableActionButton
              isDisabled={busy}
              onPress={() => {
                void run(
                  repo.updateMedication(circleId, personId, row.original.id, {
                    isActive: !row.original.isActive,
                  }),
                  row.original.isActive ? "Ditamatkan." : "Diaktifkan semula."
                )
              }}
            >
              {row.original.isActive ? "Tamatkan" : "Aktif semula"}
            </TableActionButton>
            <TableActionButton
              tone="danger"
              aria-label={`Padam ${row.original.name}`}
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
        label="Gagal memuatkan ubat."
      />

      <DataTable
        columns={columns}
        data={medications}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        pageSize={5}
        addLabel="Rekod ubat"
        onAdd={canWrite ? () => setIsCreateOpen(true) : undefined}
        toolbarStart={
          <p className="text-sm text-muted-foreground">
            Satu preskripsi. Jadual dos disimpan pada ubat, dan dos harian
            muncul dalam tab Dos.
          </p>
        }
        emptyIcon={<IconPill />}
        emptyTitle="Tiada ubat"
        emptyDescription="Ubat berkala, vitamin, apa sahaja yang ada jadual dos."
      />

      <CreateMedicationDialog
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        isSaving={busy}
        onSubmit={(input) =>
          run(
            repo
              .createMedication(circleId, personId, input)
              .then(() => setIsCreateOpen(false)),
            "Ubat direkodkan."
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
        title="Padam ubat ini?"
        description={`${deleteTarget?.name ?? "Ubat"} dibuang bersama jadual dosnya. Sejarah dos yang direkodkan kekal.`}
        confirmLabel="Padam"
        variant="destructive"
        onConfirm={() => {
          const target = deleteTarget
          setDeleteTarget(null)
          if (target) {
            void run(
              repo.deleteMedication(circleId, personId, target.id),
              "Ubat dipadam."
            )
          }
        }}
      />

      {scheduleMedication ? (
        <ScheduleDialog
          circleId={circleId}
          personId={personId}
          medication={scheduleMedication}
          onClose={() => setScheduleMedication(null)}
        />
      ) : null}
    </div>
  )
}

function CreateMedicationDialog({
  isOpen,
  onOpenChange,
  isSaving,
  onSubmit,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isSaving: boolean
  onSubmit: (input: {
    name: string
    form?: MedicationForm
    strength?: string
    instructions?: string
    startedOn: string
  }) => void
}) {
  const [name, setName] = useState("")
  const [form, setForm] = useState<MedicationForm>("tablet")
  const [strength, setStrength] = useState("")
  const [instructions, setInstructions] = useState("")
  const [startedOn, setStartedOn] = useState("")

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Rekod ubat"
      description="Nama dari preskripsi. Jadual dos ditambah selepas ubat disimpan."
      footer={
        <>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            isDisabled={isSaving || name.trim().length === 0}
            onPress={() => {
              onSubmit({
                name: name.trim(),
                form,
                strength: strength.trim() || undefined,
                instructions: instructions.trim() || undefined,
                startedOn,
              })
              setName("")
              setStrength("")
              setInstructions("")
              setStartedOn("")
            }}
          >
            Simpan
          </Button>
        </>
      }
    >
      <Field>
        <FieldLabel htmlFor="medication-name">Nama</FieldLabel>
        <Input
          id="medication-name"
          value={name}
          placeholder="Contoh: ubat darah tinggi"
          onChange={(event) => setName(event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel>Bentuk</FieldLabel>
        <Select
          className="w-full"
          aria-label="Bentuk ubat"
          value={form}
          onChange={(key) =>
            setForm(String(key ?? "tablet") as MedicationForm)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MEDICATION_FORMS.map((key) => (
              <SelectItem key={key} id={key}>
                {MEDICATION_FORM_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel htmlFor="medication-strength">Kekuatan</FieldLabel>
        <Input
          id="medication-strength"
          value={strength}
          placeholder="Contoh: 5mg"
          onChange={(event) => setStrength(event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="medication-started">Tarikh mula</FieldLabel>
        <Input
          id="medication-started"
          type="date"
          value={startedOn}
          onChange={(event) => setStartedOn(event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="medication-instructions">Arahan</FieldLabel>
        <Textarea
          id="medication-instructions"
          rows={2}
          value={instructions}
          placeholder="Contoh: ambil selepas makan"
          onChange={(event) => setInstructions(event.target.value)}
        />
      </Field>
    </ResponsiveDialog>
  )
}

/**
 * Jadual dos untuk SATU ubat.
 *
 * Dipasang HANYA bila satu ubat dipilih (induk merender `null` sebaliknya), jadi
 * tiada boolean `isOpen` dan muat-on-mount ialah satu `useEffect` bersih.
 */
function ScheduleDialog({
  circleId,
  personId,
  medication,
  onClose,
}: {
  circleId: string
  personId: string
  medication: HealthMedication
  onClose: () => void
}) {
  const repo = getHealthRepository()

  const [schedules, setSchedules] = useState<HealthSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      setError(null)
      const next = await repo.listSchedules(
        circleId,
        personId,
        medication.id
      )
      setSchedules(next)
    } catch (cause) {
      setError(
        isApiError(cause)
          ? cause
          : new ApiError("Gagal memuatkan jadual.", {
              code: "internal",
              status: 500,
            })
      )
      setSchedules([])
    } finally {
      setIsLoading(false)
    }
  }, [circleId, medication.id, personId, repo])

  // Dipasang hanya bila satu ubat dipilih, jadi muat-on-mount ialah satu
  // `useEffect` - sama seperti `usePersonHealth`. Tiada setState segerak dalam
  // badan kesan (isLoading bermula `true` dan hanya ditetapkan selepas await),
  // jadi peraturan eslint tidak berkenaan di sini.
  useEffect(() => {
    void load()
  }, [load])

  async function run(action: Promise<unknown>, done: string) {
    setBusy(true)
    try {
      await action
      toast.success(done)
      await load()
    } catch (cause) {
      toast.error(
        isApiError(cause) ? messageForApiError(cause) : "Tindakan gagal."
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <ResponsiveDialog
      isOpen
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
      title={`Jadual - ${medication.name}`}
      description="Satu baris = satu masa pengambilan. Dos harian terhasil daripada ini."
    >
      {error ? (
        <AsyncStateBanner
          error={error}
          onRetry={() => void load()}
          label="Gagal memuatkan jadual."
        />
      ) : null}
      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : schedules.length === 0 ? (
        <div className="rounded-xl border p-4 text-center text-sm text-muted-foreground">
          Belum ada jadual. Tambah satu di bawah.
        </div>
      ) : (
        <ul className="divide-y rounded-xl border">
          {schedules.map((schedule) => (
            <li
              key={schedule.id}
              className="flex flex-wrap items-center gap-3 p-3"
            >
              <span className="w-14 shrink-0 font-heading text-lg tabular-nums">
                {schedule.timeOfDay}
              </span>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="font-medium">
                  {schedule.doseAmount} {schedule.doseUnit}
                </p>
                <p className="text-xs text-muted-foreground">
                  {schedule.daysOfWeek && schedule.daysOfWeek.length > 0
                    ? schedule.daysOfWeek
                        .map(
                          (day) =>
                            WEEKDAYS.find((w) => w.value === day)?.short ??
                            String(day)
                        )
                        .join(", ")
                    : "Setiap hari"}
                  {schedule.withFood ? " - dengan makanan" : ""}
                </p>
              </div>
              <TableActionButton
                tone="danger"
                aria-label={`Padam jadual ${schedule.timeOfDay}`}
                isDisabled={busy}
                onPress={() => {
                  void run(
                    repo.deleteSchedule(circleId, personId, schedule.id),
                    "Jadual dipadam."
                  )
                }}
              >
                Padam
              </TableActionButton>
            </li>
          ))}
        </ul>
      )}

      <AddScheduleForm
        busy={busy}
        onSubmit={(input) =>
          run(
            repo.createSchedule(circleId, personId, medication.id, input),
            "Jadual ditambah."
          )
        }
      />
    </ResponsiveDialog>
  )
}

function AddScheduleForm({
  busy,
  onSubmit,
}: {
  busy: boolean
  onSubmit: (input: {
    timeOfDay: string
    daysOfWeek?: number[]
    doseAmount: string
    doseUnit?: string
    withFood?: boolean
  }) => void
}) {
  const [timeOfDay, setTimeOfDay] = useState("")
  const [days, setDays] = useState<number[]>([])
  const [doseAmount, setDoseAmount] = useState("")
  const [doseUnit, setDoseUnit] = useState("biji")
  const [withFood, setWithFood] = useState(false)

  function toggleDay(day: number) {
    setDays((current) =>
      current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day].sort()
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-3">
      <p className="text-sm font-medium">Tambah jadual</p>
      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel htmlFor="schedule-time">Masa</FieldLabel>
          <Input
            id="schedule-time"
            type="time"
            value={timeOfDay}
            onChange={(event) => setTimeOfDay(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="schedule-amount">Jumlah dos</FieldLabel>
          <Input
            id="schedule-amount"
            inputMode="decimal"
            value={doseAmount}
            placeholder="1"
            onChange={(event) => setDoseAmount(event.target.value)}
          />
        </Field>
      </div>
      <Field>
        <FieldLabel htmlFor="schedule-unit">Unit</FieldLabel>
        <Input
          id="schedule-unit"
          value={doseUnit}
          onChange={(event) => setDoseUnit(event.target.value)}
        />
      </Field>
      <Field orientation="horizontal">
        <div className="min-w-0 space-y-0.5">
          <FieldLabel>Bersama makanan</FieldLabel>
          <FieldDescription>
            Tandakan bila perlu diambil selepas makan.
          </FieldDescription>
        </div>
        <Switch
          aria-label="Bersama makanan"
          isSelected={withFood}
          onChange={setWithFood}
        />
      </Field>
      <Field>
        <FieldLabel>Hari</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((day) => (
            <Button
              key={day.value}
              size="sm"
              variant={days.includes(day.value) ? "default" : "outline"}
              onPress={() => toggleDay(day.value)}
            >
              {day.short}
            </Button>
          ))}
        </div>
        <FieldDescription>Kosong bermakna setiap hari.</FieldDescription>
      </Field>
      <Button
        isDisabled={
          busy || timeOfDay.length === 0 || doseAmount.trim().length === 0
        }
        onPress={() => {
          onSubmit({
            timeOfDay,
            daysOfWeek: days,
            doseAmount: doseAmount.trim(),
            doseUnit: doseUnit.trim() || undefined,
            withFood: withFood || undefined,
          })
          setTimeOfDay("")
          setDays([])
          setDoseAmount("")
          setWithFood(false)
        }}
      >
        Tambah
      </Button>
    </div>
  )
}