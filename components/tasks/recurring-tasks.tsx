"use client"

import { useState } from "react"
import { IconPencil, IconRepeat } from "@tabler/icons-react"
import { toast } from "sonner"

import { createDataTableColumnHelper, DataTable } from "@/components/data-table"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { StatusChip } from "@/components/status-chip"
import { AsyncStateBanner } from "@/components/shared/async-state"
import { TableActionButton, TableActions } from "@/components/table-actions"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRecurringTasks } from "@/hooks/use-recurring-tasks"
import { useDisplayFormat } from "@/lib/application/display-preferences"
import { getTaskRepository } from "@/lib/composition/task-repository"
import { WEEKDAY_SHORT } from "@/lib/domain/care"
import type { CircleMember, CirclePerson } from "@/lib/domain/circle"
import {
  RECURRENCE_FREQ_LABELS,
  RECURRENCE_FREQS,
  type RecurrenceFreq,
  type RecurringInput,
  type RecurringTask,
} from "@/lib/domain/task"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"

const NONE = "none"
const UNIT: Record<RecurrenceFreq, string> = {
  daily: "hari",
  weekly: "minggu",
  monthly: "bulan",
  yearly: "tahun",
}

/** "Setiap bulan, 5hb, hingga 31/12/2026" - peraturan dibaca seperti ayat. */
function ruleText(r: RecurringTask, date: (iso: string) => string) {
  const parts = [
    r.interval === 1
      ? `Setiap ${UNIT[r.freq]}`
      : `Setiap ${r.interval} ${UNIT[r.freq]}`,
  ]
  if (r.freq === "weekly" && r.daysOfWeek.length > 0) {
    parts.push(
      [...r.daysOfWeek]
        .sort()
        .map((d) => WEEKDAY_SHORT[d])
        .join(", ")
    )
  }
  if (r.freq === "monthly") {
    const dom = r.dayOfMonth ?? Number(r.startsOn.slice(8, 10))
    parts.push(dom === -1 ? "hari terakhir" : `${dom}hb`)
  }
  if (r.freq === "yearly") {
    parts.push(
      `${Number(r.startsOn.slice(8, 10))}/${Number(r.startsOn.slice(5, 7))}`
    )
  }
  if (r.until) parts.push(`hingga ${date(r.until)}`)
  if (r.maxCount) parts.push(`${r.maxCount} kali`)
  return parts.join(", ")
}

function todayInput() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function toInput(r: RecurringTask, isActive = r.isActive): RecurringInput {
  return {
    title: r.task.title,
    description: r.task.description ?? "",
    priority: r.task.priority,
    assigneeMemberId: r.task.assigneeMemberId ?? "",
    personId: r.task.personId ?? "",
    freq: r.freq,
    interval: r.interval,
    daysOfWeek: r.daysOfWeek,
    dayOfMonth: r.dayOfMonth,
    startsOn: r.startsOn,
    until: r.until ?? "",
    maxCount: r.maxCount,
    isActive,
  }
}

/**
 * Tugasan berulang circle - "bayar bil air setiap bulan". Setiap kejadian muncul
 * dalam senarai tugasan seminggu sebelum tarikh akhirnya. Menyunting tidak
 * menyentuh tugasan yang sudah muncul; yang tidak lagi perlu dihentikan.
 */
export function RecurringTasks({
  circleId,
  canCreate,
  canUpdate,
  members,
  persons,
  onChanged,
}: {
  circleId: string
  canCreate: boolean
  canUpdate: boolean
  members: CircleMember[]
  persons: CirclePerson[]
  /** Pelayan menjana tugasan - senarai tugasan perlu dimuat semula. */
  onChanged: () => void
}) {
  const { date } = useDisplayFormat()
  const { recurring, isLoading, error, reload } = useRecurringTasks(circleId)
  const repo = getTaskRepository()
  const [busy, setBusy] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<RecurringTask | null>(null)

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

  const helper = createDataTableColumnHelper<RecurringTask>()
  const columns = helper.columns([
    helper.accessor((row) => row.task.title, {
      id: "title",
      header: "Tugasan",
      cell: ({ row }) => (
        <div className="min-w-0 space-y-0.5">
          <p className="font-medium">{row.original.task.title}</p>
          {row.original.task.personName ? (
            <p className="text-xs text-muted-foreground">
              untuk {row.original.task.personName}
            </p>
          ) : null}
        </div>
      ),
    }),
    helper.accessor((row) => ruleText(row, date), {
      id: "rule",
      header: "Bila",
    }),
    helper.accessor((row) => row.task.assigneeName ?? "", {
      id: "assignee",
      header: "Penerima",
      cell: ({ getValue }) =>
        getValue() || <span className="text-muted-foreground">-</span>,
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
        canUpdate ? (
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
                  repo.replaceRecurring(
                    circleId,
                    row.original.task.id,
                    toInput(row.original, !row.original.isActive)
                  ),
                  row.original.isActive
                    ? "Tugasan berulang dihentikan."
                    : "Tugasan berulang diaktifkan semula."
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
        label="Gagal memuatkan tugasan berulang."
      />
      <DataTable
        columns={columns}
        data={recurring}
        getRowId={(row) => row.task.id}
        isLoading={isLoading}
        pageSize={5}
        addLabel="Tugasan berulang"
        onAdd={
          canCreate && !error
            ? () => {
                setEditTarget(null)
                setIsFormOpen(true)
              }
            : undefined
        }
        toolbarStart={
          <p className="text-sm text-muted-foreground">
            Berulang: setiap kejadian muncul dalam senarai di atas seminggu
            sebelum tarikhnya.
          </p>
        }
        emptyIcon={<IconRepeat />}
        emptyTitle="Tiada tugasan berulang"
        emptyDescription="Contoh: bayar bil air setiap bulan 5hb, servis kereta setiap tahun."
      />
      <RecurringDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        isSaving={busy}
        target={editTarget}
        members={members}
        persons={persons}
        onSubmit={(input) =>
          void run(
            (editTarget
              ? repo.replaceRecurring(circleId, editTarget.task.id, input)
              : repo.createRecurring(circleId, input)
            ).then(() => setIsFormOpen(false)),
            editTarget
              ? "Tugasan berulang disunting. Yang sudah muncul tidak berubah."
              : "Tugasan berulang ditetapkan."
          )
        }
      />
    </div>
  )
}

function RecurringDialog({
  isOpen,
  onOpenChange,
  isSaving,
  target,
  members,
  persons,
  onSubmit,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isSaving: boolean
  target: RecurringTask | null
  members: CircleMember[]
  persons: CirclePerson[]
  onSubmit: (input: RecurringInput) => void
}) {
  const blank: RecurringInput = {
    title: "",
    description: "",
    priority: "normal",
    assigneeMemberId: "",
    personId: "",
    freq: "monthly",
    interval: 1,
    daysOfWeek: [],
    startsOn: todayInput(),
    until: "",
    isActive: true,
  }
  const [form, setForm] = useState<RecurringInput>(blank)
  const set = (patch: Partial<RecurringInput>) => setForm({ ...form, ...patch })

  const isValid =
    form.title.trim() !== "" &&
    form.startsOn !== "" &&
    form.interval >= 1 &&
    (form.until === "" || form.until >= form.startsOn)

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (open) setForm(target ? toInput(target) : blank)
        onOpenChange(open)
      }}
      title={target ? "Sunting tugasan berulang" : "Tugasan berulang"}
      description="Apa, berapa kerap, dan siapa. Setiap kejadian ialah tugasan sendiri."
      footer={
        <>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            isDisabled={isSaving || !isValid}
            onPress={() => onSubmit({ ...form, title: form.title.trim() })}
          >
            Simpan
          </Button>
        </>
      }
    >
      <Field>
        <FieldLabel htmlFor="rec-title">Tugasan</FieldLabel>
        <Input
          id="rec-title"
          value={form.title}
          maxLength={200}
          placeholder="Contoh: bayar bil air"
          onChange={(event) => set({ title: event.target.value })}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel>Kekerapan</FieldLabel>
          <Select
            className="w-full"
            aria-label="Kekerapan"
            value={form.freq}
            onChange={(key) =>
              set({ freq: String(key ?? "monthly") as RecurrenceFreq })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECURRENCE_FREQS.map((f) => (
                <SelectItem key={f} id={f}>
                  {RECURRENCE_FREQ_LABELS[f]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="rec-interval">
            Setiap berapa {UNIT[form.freq]}
          </FieldLabel>
          <Input
            id="rec-interval"
            type="number"
            min={1}
            value={String(form.interval)}
            onChange={(event) =>
              set({ interval: Number(event.target.value) || 1 })
            }
          />
        </Field>
      </div>
      {form.freq === "weekly" ? (
        <Field>
          <FieldLabel>Hari</FieldLabel>
          <div className="flex flex-wrap gap-3">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <Field
                key={d}
                orientation="horizontal"
                className="w-auto items-center"
              >
                <Checkbox
                  id={`rec-day-${d}`}
                  isSelected={form.daysOfWeek.includes(d)}
                  onChange={(selected) =>
                    set({
                      daysOfWeek: selected
                        ? [...form.daysOfWeek, d]
                        : form.daysOfWeek.filter((x) => x !== d),
                    })
                  }
                />
                <FieldLabel htmlFor={`rec-day-${d}`} className="font-normal">
                  {WEEKDAY_SHORT[d]}
                </FieldLabel>
              </Field>
            ))}
          </div>
          <FieldDescription>
            Tiada yang ditanda: hari yang sama dengan tarikh mula.
          </FieldDescription>
        </Field>
      ) : null}
      {form.freq === "monthly" ? (
        <Field>
          <FieldLabel htmlFor="rec-dom">Hari bulan</FieldLabel>
          <Input
            id="rec-dom"
            type="number"
            min={-1}
            max={31}
            value={form.dayOfMonth === undefined ? "" : String(form.dayOfMonth)}
            placeholder="Sama dengan tarikh mula"
            onChange={(event) =>
              set({
                dayOfMonth:
                  event.target.value === ""
                    ? undefined
                    : Number(event.target.value),
              })
            }
          />
          <FieldDescription>
            -1 untuk hari terakhir. 31hb jatuh ke hujung bulan yang pendek.
          </FieldDescription>
        </Field>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel htmlFor="rec-start">Bermula</FieldLabel>
          <Input
            id="rec-start"
            type="date"
            value={form.startsOn}
            onChange={(event) => set({ startsOn: event.target.value })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="rec-until">Hingga (pilihan)</FieldLabel>
          <Input
            id="rec-until"
            type="date"
            value={form.until}
            aria-invalid={form.until !== "" && form.until < form.startsOn}
            onChange={(event) => set({ until: event.target.value })}
          />
        </Field>
      </div>
      <Field>
        <FieldLabel>Penerima</FieldLabel>
        <Select
          className="w-full"
          aria-label="Penerima"
          value={form.assigneeMemberId || NONE}
          onChange={(key) =>
            set({ assigneeMemberId: key === NONE ? "" : String(key ?? "") })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem id={NONE}>Belum ditetapkan</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} id={m.id}>
                {m.nickname || m.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldDescription>
          Penerima diberitahu setiap kali tugasan baharu muncul.
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Untuk siapa</FieldLabel>
        <Select
          className="w-full"
          aria-label="Untuk siapa"
          value={form.personId || NONE}
          onChange={(key) =>
            set({ personId: key === NONE ? "" : String(key ?? "") })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem id={NONE}>Rumah tangga (bukan seseorang)</SelectItem>
            {persons.map((p) => (
              <SelectItem key={p.id} id={p.id}>
                {p.preferredName || p.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </ResponsiveDialog>
  )
}
