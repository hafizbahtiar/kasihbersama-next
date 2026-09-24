"use client"

import { useState } from "react"
import {
  IconChecklist,
  IconListCheck,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { createDataTableColumnHelper, DataTable } from "@/components/data-table"
import { usePlatform } from "@/components/platform/platform-provider"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { StatusChip, type StatusTone } from "@/components/status-chip"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useCircleMembers } from "@/hooks/use-circle-members"
import { useCirclePersons } from "@/hooks/use-circle-persons"
import { useTasks } from "@/hooks/use-tasks"
import { useDisplayFormat } from "@/lib/application/display-preferences"
import { getTaskRepository } from "@/lib/composition/task-repository"
import type { CircleMember, CirclePerson } from "@/lib/domain/circle"
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  type Task,
  type TaskInput,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/domain/task"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"

const STATUS_TONE: Record<TaskStatus, StatusTone> = {
  todo: "attention",
  doing: "positive",
  done: "neutral",
  cancelled: "neutral",
}

const PRIORITY_TONE: Record<TaskPriority, StatusTone> = {
  urgent: "critical",
  high: "attention",
  normal: "neutral",
  low: "neutral",
}

/** Pilihan "tiada" dalam Select: react-aria tidak menerima kunci kosong. */
const NONE = "none"

/**
 * Tugasan circle AKTIF - "Hantar mak ke klinik", "Bayar bil air". Satu senarai;
 * papan kanban dan kalendar menyusul atas data yang sama. Penerima sentiasa
 * boleh menggerakkan tugasannya sendiri dan menanda senarai semaknya, walaupun
 * tanpa kebenaran menyunting tugasan lain.
 */
export function TasksPage() {
  const { activeCircle, can } = usePlatform()
  if (!activeCircle) {
    return (
      <p className="text-sm text-muted-foreground">
        Pilih atau cipta circle dahulu - tugasan milik satu circle.
      </p>
    )
  }
  return (
    <CircleTasks
      key={activeCircle.id}
      circleId={activeCircle.id}
      memberId={activeCircle.memberId}
      canCreate={can("core.task.create")}
      canUpdate={can("core.task.update")}
      canDelete={can("core.task.delete")}
    />
  )
}

function CircleTasks({
  circleId,
  memberId,
  canCreate,
  canUpdate,
  canDelete,
}: {
  circleId: string
  memberId: string
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
}) {
  const { date, dateTime } = useDisplayFormat()
  const [includeCancelled, setIncludeCancelled] = useState(false)
  const { tasks, isLoading, error, reload } = useTasks(
    circleId,
    includeCancelled
  )
  const canEditAny = canCreate || canUpdate
  const members = useCircleMembers(circleId)
  const persons = useCirclePersons(circleId, canEditAny)
  const repo = getTaskRepository()

  const [busy, setBusy] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Task | null>(null)
  const [checklistTarget, setChecklistTarget] = useState<Task | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null)

  async function run(action: Promise<unknown>, done: string) {
    setBusy(true)
    try {
      await action
      toast.success(done)
    } catch (cause) {
      toast.error(
        isApiError(cause) ? messageForApiError(cause) : "Tindakan gagal."
      )
    } finally {
      setBusy(false)
      await reload()
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  const isOverdue = (t: Task) =>
    t.status !== "done" &&
    t.status !== "cancelled" &&
    ((t.dueOn !== undefined && t.dueOn < today) ||
      (t.dueAt !== undefined && new Date(t.dueAt) < new Date()))

  const helper = createDataTableColumnHelper<Task>()
  const columns = helper.columns([
    helper.accessor("title", {
      header: "Tugasan",
      cell: ({ row }) => (
        <div className="min-w-0 space-y-0.5">
          <p className="font-medium">{row.original.title}</p>
          {row.original.personName ? (
            <p className="text-xs text-muted-foreground">
              untuk {row.original.personName}
            </p>
          ) : null}
          {row.original.description ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {row.original.description}
            </p>
          ) : null}
        </div>
      ),
    }),
    helper.accessor((row) => row.assigneeName ?? "", {
      id: "assignee",
      header: "Penerima",
      cell: ({ getValue }) =>
        getValue() || <span className="text-muted-foreground">-</span>,
    }),
    helper.accessor((row) => row.dueAt ?? row.dueOn ?? "", {
      id: "due",
      header: "Tarikh akhir",
      cell: ({ row }) => {
        const t = row.original
        const label = t.dueAt ? dateTime(t.dueAt) : t.dueOn ? date(t.dueOn) : ""
        if (!label) return <span className="text-muted-foreground">-</span>
        return (
          <span
            className={
              isOverdue(t)
                ? "font-medium whitespace-nowrap text-destructive"
                : "whitespace-nowrap"
            }
          >
            {label}
            {isOverdue(t) ? " (lewat)" : ""}
          </span>
        )
      },
    }),
    helper.accessor("priority", {
      header: "Keutamaan",
      filterFn: "equalsString",
      cell: ({ getValue }) => (
        <StatusChip
          tone={PRIORITY_TONE[getValue()]}
          label={TASK_PRIORITY_LABELS[getValue()]}
        />
      ),
    }),
    helper.accessor("status", {
      header: "Status",
      filterFn: "equalsString",
      cell: ({ getValue }) => (
        <StatusChip
          tone={STATUS_TONE[getValue()]}
          label={TASK_STATUS_LABELS[getValue()]}
        />
      ),
    }),
    helper.display({
      id: "action",
      header: () => <span className="flex justify-end">Tindakan</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const t = row.original
        const mine = t.assigneeMemberId === memberId
        const canMove = canUpdate || mine
        const move = (status: TaskStatus, done: string) =>
          void run(repo.setStatus(circleId, t.id, status), done)
        return (
          <TableActions>
            {canMove && t.status === "todo" ? (
              <TableActionButton
                isDisabled={busy}
                onPress={() => move("doing", "Tugasan dimulakan.")}
              >
                Mula
              </TableActionButton>
            ) : null}
            {canMove && (t.status === "todo" || t.status === "doing") ? (
              <TableActionButton
                isDisabled={busy}
                onPress={() => move("done", "Tugasan siap.")}
              >
                Siap
              </TableActionButton>
            ) : null}
            {canMove && (t.status === "done" || t.status === "cancelled") ? (
              <TableActionButton
                isDisabled={busy}
                onPress={() => move("todo", "Tugasan dibuka semula.")}
              >
                Buka semula
              </TableActionButton>
            ) : null}
            <TableActionButton
              isDisabled={busy}
              onPress={() => setChecklistTarget(t)}
            >
              <IconChecklist />
              {t.checklistTotal > 0
                ? `${t.checklistDone}/${t.checklistTotal}`
                : "Senarai semak"}
            </TableActionButton>
            {canUpdate ? (
              <TableActionButton
                isDisabled={busy}
                onPress={() => {
                  setEditTarget(t)
                  setIsFormOpen(true)
                }}
              >
                <IconPencil />
                Sunting
              </TableActionButton>
            ) : null}
            {canUpdate && t.status !== "cancelled" && t.status !== "done" ? (
              <TableActionButton
                isDisabled={busy}
                onPress={() => move("cancelled", "Tugasan dibatalkan.")}
              >
                Batal
              </TableActionButton>
            ) : null}
            {canDelete ? (
              <TableActionButton
                tone="danger"
                aria-label={`Padam tugasan ${t.title}`}
                isDisabled={busy}
                onPress={() => setDeleteTarget(t)}
              >
                <IconTrash />
                Padam
              </TableActionButton>
            ) : null}
          </TableActions>
        )
      },
    }),
  ])

  return (
    <div className="flex flex-col gap-4">
      <AsyncStateBanner
        error={error}
        onRetry={() => void reload()}
        label="Gagal memuatkan tugasan."
      />

      <DataTable
        columns={columns}
        data={tasks}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        pageSize={10}
        addLabel="Tambah tugasan"
        onAdd={
          canCreate && !error
            ? () => {
                setEditTarget(null)
                setIsFormOpen(true)
              }
            : undefined
        }
        toolbarStart={
          <Switch isSelected={includeCancelled} onChange={setIncludeCancelled}>
            Tunjuk yang dibatalkan
          </Switch>
        }
        emptyIcon={<IconListCheck />}
        emptyTitle="Tiada tugasan"
        emptyDescription="Hantar mak ke klinik, bayar bil air - siapa buat apa, dan bila."
      />

      <TaskDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        isSaving={busy}
        target={editTarget}
        members={members.data.filter((m) => m.status === "active")}
        persons={persons.data}
        onSubmit={(input) =>
          void run(
            (editTarget
              ? repo.updateTask(circleId, editTarget.id, input)
              : repo.createTask(circleId, input)
            ).then(() => setIsFormOpen(false)),
            editTarget ? "Tugasan disunting." : "Tugasan ditambah."
          )
        }
      />

      <ChecklistDialog
        circleId={circleId}
        target={checklistTarget}
        canEdit={canUpdate}
        canTick={canUpdate || checklistTarget?.assigneeMemberId === memberId}
        onClose={() => {
          setChecklistTarget(null)
          void reload()
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Padam tugasan ini?"
        description={`"${deleteTarget?.title ?? ""}" dibuang terus. Untuk menyimpan sejarah, batalkan sebaliknya.`}
        confirmLabel="Padam"
        variant="destructive"
        onConfirm={() => {
          const target = deleteTarget
          setDeleteTarget(null)
          if (target) {
            void run(repo.deleteTask(circleId, target.id), "Tugasan dipadam.")
          }
        }}
      />
    </div>
  )
}

/** "YYYY-MM-DD" + "HH:MM" waktu pelayar -> ISO; waktu kosong = hari penuh. */
function dueFields(
  day: string,
  time: string
): { dueOn: string; dueAt: string } {
  if (!day) return { dueOn: "", dueAt: "" }
  if (!time) return { dueOn: day, dueAt: "" }
  const at = new Date(`${day}T${time}`)
  return Number.isNaN(at.getTime())
    ? { dueOn: day, dueAt: "" }
    : { dueOn: "", dueAt: at.toISOString() }
}

function localParts(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return {
    day: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

function TaskDialog({
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
  target: Task | null
  members: CircleMember[]
  persons: CirclePerson[]
  onSubmit: (input: TaskInput) => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<TaskPriority>("normal")
  const [day, setDay] = useState("")
  const [time, setTime] = useState("")
  const [assignee, setAssignee] = useState(NONE)
  const [person, setPerson] = useState(NONE)

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (open) {
          const due = target?.dueAt
            ? localParts(target.dueAt)
            : { day: target?.dueOn ?? "", time: "" }
          setTitle(target?.title ?? "")
          setDescription(target?.description ?? "")
          setPriority(target?.priority ?? "normal")
          setDay(due.day)
          setTime(due.time)
          setAssignee(target?.assigneeMemberId ?? NONE)
          setPerson(target?.personId ?? NONE)
        }
        onOpenChange(open)
      }}
      title={target ? "Sunting tugasan" : "Tambah tugasan"}
      description="Apa yang perlu dibuat, siapa buat, dan bila."
      footer={
        <>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            isDisabled={isSaving || title.trim() === ""}
            onPress={() =>
              onSubmit({
                title: title.trim(),
                description: description.trim(),
                priority,
                ...dueFields(day, time),
                assigneeMemberId: assignee === NONE ? "" : assignee,
                personId: person === NONE ? "" : person,
              })
            }
          >
            Simpan
          </Button>
        </>
      }
    >
      <Field>
        <FieldLabel htmlFor="task-title">Tugasan</FieldLabel>
        <Input
          id="task-title"
          value={title}
          maxLength={200}
          placeholder="Contoh: hantar mak ke klinik"
          onChange={(event) => setTitle(event.target.value)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel htmlFor="task-day">Tarikh akhir</FieldLabel>
          <Input
            id="task-day"
            type="date"
            value={day}
            onChange={(event) => setDay(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="task-time">Pukul (pilihan)</FieldLabel>
          <Input
            id="task-time"
            type="time"
            value={time}
            disabled={!day}
            onChange={(event) => setTime(event.target.value)}
          />
        </Field>
      </div>
      <Field>
        <FieldLabel>Penerima</FieldLabel>
        <Select
          className="w-full"
          aria-label="Penerima tugasan"
          value={assignee}
          onChange={(key) => setAssignee(String(key ?? NONE))}
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
        <FieldDescription>Penerima diberitahu.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Untuk siapa</FieldLabel>
        <Select
          className="w-full"
          aria-label="Tugasan untuk siapa"
          value={person}
          onChange={(key) => setPerson(String(key ?? NONE))}
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
        <FieldDescription>
          Tugasan tentang seseorang hanya kelihatan kepada yang boleh melihat
          orang itu.
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Keutamaan</FieldLabel>
        <Select
          className="w-full"
          aria-label="Keutamaan tugasan"
          value={priority}
          onChange={(key) =>
            setPriority(String(key ?? "normal") as TaskPriority)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TASK_PRIORITIES.map((p) => (
              <SelectItem key={p} id={p}>
                {TASK_PRIORITY_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel htmlFor="task-description">Nota</FieldLabel>
        <Textarea
          id="task-description"
          rows={2}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </Field>
    </ResponsiveDialog>
  )
}

/**
 * Senarai semak satu tugasan. Dimuat sendiri (bacaan satu tugasan membawa
 * item); setiap tulisan memulangkan tugasan terkini, jadi tiada muat semula.
 */
function ChecklistDialog({
  circleId,
  target,
  canEdit,
  canTick,
  onClose,
}: {
  circleId: string
  target: Task | null
  canEdit: boolean
  canTick: boolean
  onClose: () => void
}) {
  const repo = getTaskRepository()
  const [task, setTask] = useState<Task | null>(null)
  const [label, setLabel] = useState("")
  const [busy, setBusy] = useState(false)

  async function apply(action: Promise<Task>) {
    setBusy(true)
    try {
      setTask(await action)
    } catch (cause) {
      toast.error(
        isApiError(cause) ? messageForApiError(cause) : "Tindakan gagal."
      )
    } finally {
      setBusy(false)
    }
  }

  const items = task?.checklist ?? []

  return (
    <ResponsiveDialog
      isOpen={Boolean(target)}
      onOpenChange={(open) => {
        if (open && target) {
          setTask(null)
          setLabel("")
          void apply(repo.getTask(circleId, target.id))
        }
        if (!open) onClose()
      }}
      title="Senarai semak"
      description={target?.title}
      footer={
        <Button variant="outline" onPress={onClose}>
          Tutup
        </Button>
      }
    >
      {task === null ? (
        <p className="text-sm text-muted-foreground">Memuatkan...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada item.</p>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="flex items-center gap-2">
              <Checkbox
                id={`item-${it.id}`}
                isSelected={it.isDone}
                isDisabled={busy || !canTick}
                onChange={(selected) =>
                  void apply(
                    repo.setChecklistItem(circleId, task.id, it.id, selected)
                  )
                }
              />
              <FieldLabel
                htmlFor={`item-${it.id}`}
                className={
                  it.isDone
                    ? "flex-1 font-normal text-muted-foreground line-through"
                    : "flex-1 font-normal"
                }
              >
                {it.label}
              </FieldLabel>
              {canEdit ? (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Buang ${it.label}`}
                  isDisabled={busy}
                  onPress={() =>
                    void apply(
                      repo.deleteChecklistItem(circleId, task.id, it.id)
                    )
                  }
                >
                  <IconTrash />
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      )}
      {canEdit && task ? (
        <div className="flex gap-2">
          <Input
            aria-label="Item baharu"
            value={label}
            maxLength={200}
            placeholder="Contoh: bawa kad pengenalan mak"
            onChange={(event) => setLabel(event.target.value)}
          />
          <Button
            isDisabled={busy || label.trim() === ""}
            onPress={() => {
              const l = label.trim()
              setLabel("")
              void apply(repo.addChecklistItem(circleId, task.id, l))
            }}
          >
            Tambah
          </Button>
        </div>
      ) : null}
    </ResponsiveDialog>
  )
}
