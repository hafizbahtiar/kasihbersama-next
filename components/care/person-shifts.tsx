"use client"

import { useState } from "react"
import { IconCalendarUser, IconPencil } from "@tabler/icons-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { createDataTableColumnHelper, DataTable } from "@/components/data-table"
import { nowLocalInput } from "@/components/health/person-vitals"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { StatusChip, type StatusTone } from "@/components/status-chip"
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
import { useCirclePersons } from "@/hooks/use-circle-persons"
import { usePersonShifts } from "@/hooks/use-person-shifts"
import { useDisplayFormat } from "@/lib/application/display-preferences"
import { getCareRepository } from "@/lib/composition/care-repository"
import type { CirclePerson } from "@/lib/domain/circle"
import {
  CARE_SHIFT_STATUS_LABELS,
  type CareShift,
  type CareShiftInput,
  type CareShiftStatus,
} from "@/lib/domain/care"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"

/** Nada ikut MAKNA: yang sedang berjalan ialah yang keluarga perlu tahu sekarang. */
const STATUS_TONE: Record<CareShiftStatus, StatusTone> = {
  dijadualkan: "attention",
  berjalan: "positive",
  selesai: "neutral",
  terlepas: "critical",
  dibatalkan: "neutral",
  digantikan: "neutral",
}

type HandoverMode = { shift: CareShift; mode: "end" | "handover" }

/**
 * Giliran menjaga untuk SATU person - "siapa jaga mak bila". Penjaga ialah
 * person dalam circle, bukan semestinya ahli yang ada akaun, jadi sesiapa yang
 * boleh menulis menandakan mula/habis untuknya. Giliran yang salah dibatalkan,
 * bukan dipadam: siapa sepatutnya jaga kekal sebagai rekod.
 */
export function PersonShifts({
  circleId,
  personId,
  canWrite,
}: {
  circleId: string
  personId: string
  /** `care.shift.create` - akses ringkasan melihat siapa/bila sahaja. */
  canWrite: boolean
}) {
  const { dateTime } = useDisplayFormat()
  const { shifts, hasMore, isLoading, error, reload, loadMore } =
    usePersonShifts(circleId, personId)
  const persons = useCirclePersons(circleId, canWrite)
  // Penjaga ialah orang LAIN dalam circle - bukan orang yang dijaga.
  const caregivers = persons.data.filter((p) => p.id !== personId)
  const repo = getCareRepository()

  const [busy, setBusy] = useState(false)
  const [editTarget, setEditTarget] = useState<CareShift | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [handover, setHandover] = useState<HandoverMode | null>(null)
  const [replaceTarget, setReplaceTarget] = useState<CareShift | null>(null)
  const [cancelTarget, setCancelTarget] = useState<CareShift | null>(null)

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
      // Muat semula walaupun gagal: 409 bermakna orang lain sudah menukarnya.
      await reload()
    }
  }

  const helper = createDataTableColumnHelper<CareShift>()
  const columns = helper.columns([
    helper.accessor("startsAt", {
      header: "Bila",
      cell: ({ row }) => (
        <div className="space-y-0.5 whitespace-nowrap text-muted-foreground">
          <p>{dateTime(row.original.startsAt)}</p>
          <p className="text-xs">hingga {dateTime(row.original.endsAt)}</p>
        </div>
      ),
    }),
    helper.accessor("caregiverName", {
      header: "Penjaga",
      cell: ({ row }) => (
        <div className="min-w-0 space-y-0.5">
          <p className="font-medium">{row.original.caregiverName}</p>
          {row.original.replacedShiftId ? (
            <p className="text-xs text-muted-foreground">ambil alih giliran</p>
          ) : row.original.rotaId ? (
            <p className="text-xs text-muted-foreground">dari jadual tetap</p>
          ) : null}
          {row.original.note ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {row.original.note}
            </p>
          ) : null}
        </div>
      ),
    }),
    helper.accessor("status", {
      header: "Status",
      filterFn: "equalsString",
      cell: ({ getValue }) => (
        <StatusChip
          tone={STATUS_TONE[getValue()]}
          label={CARE_SHIFT_STATUS_LABELS[getValue()]}
        />
      ),
    }),
    helper.accessor((row) => row.handoverNote ?? "", {
      id: "handover",
      header: "Serah tugas",
      cell: ({ row }) =>
        row.original.handoverNote ? (
          <p className="line-clamp-3 text-sm whitespace-pre-line">
            {row.original.handoverNote}
          </p>
        ) : row.original.status === "selesai" ? (
          <span className="text-sm text-muted-foreground italic">
            Belum ditulis
          </span>
        ) : null,
    }),
    helper.display({
      id: "action",
      header: () => <span className="flex justify-end">Tindakan</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const shift = row.original
        if (!canWrite) return null
        if (shift.status === "dijadualkan") {
          return (
            <TableActions>
              <TableActionButton
                isDisabled={busy}
                onPress={() =>
                  void run(
                    repo.startShift(circleId, personId, shift.id),
                    "Giliran bermula."
                  )
                }
              >
                Mula
              </TableActionButton>
              <TableActionButton
                isDisabled={busy}
                onPress={() => {
                  setEditTarget(shift)
                  setIsFormOpen(true)
                }}
              >
                <IconPencil />
                Sunting
              </TableActionButton>
              <TableActionButton
                isDisabled={busy}
                onPress={() => setReplaceTarget(shift)}
              >
                Ganti
              </TableActionButton>
              <TableActionButton
                tone="danger"
                isDisabled={busy}
                onPress={() => setCancelTarget(shift)}
              >
                Batal
              </TableActionButton>
            </TableActions>
          )
        }
        if (shift.status === "terlepas") {
          // Penjaga yang lewat tetap datang jaga: giliran terlepas masih boleh
          // dimulakan, atau terus ditamatkan bila orang terlupa menekan Mula.
          return (
            <TableActions>
              <TableActionButton
                isDisabled={busy}
                onPress={() =>
                  void run(
                    repo.startShift(circleId, personId, shift.id),
                    "Giliran bermula."
                  )
                }
              >
                Mula
              </TableActionButton>
              <TableActionButton
                isDisabled={busy}
                onPress={() => setHandover({ shift, mode: "end" })}
              >
                Habis
              </TableActionButton>
            </TableActions>
          )
        }
        if (shift.status === "berjalan") {
          return (
            <TableActions>
              <TableActionButton
                isDisabled={busy}
                onPress={() => setHandover({ shift, mode: "end" })}
              >
                Habis
              </TableActionButton>
            </TableActions>
          )
        }
        if (shift.status === "selesai") {
          return (
            <TableActions>
              <TableActionButton
                isDisabled={busy}
                onPress={() => setHandover({ shift, mode: "handover" })}
              >
                {shift.handoverNote
                  ? "Sunting serah tugas"
                  : "Tulis serah tugas"}
              </TableActionButton>
            </TableActions>
          )
        }
        return null
      },
    }),
  ])

  return (
    <div className="flex flex-col gap-4">
      <AsyncStateBanner
        error={error}
        onRetry={() => void reload()}
        label="Gagal memuatkan giliran menjaga."
      />

      <DataTable
        columns={columns}
        data={shifts}
        getRowId={(row) => row.id}
        isLoading={isLoading && shifts.length === 0}
        pageSize={10}
        addLabel="Tambah giliran"
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
            Siapa jaga bila. Yang terkini di atas.
          </p>
        }
        emptyIcon={<IconCalendarUser />}
        emptyTitle="Tiada giliran"
        emptyDescription='Supaya tiada lagi "aku ingat abang yang jaga hari ini".'
      />

      {hasMore ? (
        <Button
          variant="outline"
          className="self-center"
          isDisabled={isLoading}
          onPress={() => void loadMore()}
        >
          Muat giliran lebih lama
        </Button>
      ) : null}

      <ShiftDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        isSaving={busy}
        target={editTarget}
        caregivers={caregivers}
        onSubmit={(input) =>
          void run(
            (editTarget
              ? repo.updateShift(circleId, personId, editTarget.id, input)
              : repo.createShift(circleId, personId, input)
            ).then(() => setIsFormOpen(false)),
            editTarget ? "Giliran disunting." : "Giliran ditambah."
          )
        }
      />

      <HandoverDialog
        target={handover}
        isSaving={busy}
        onClose={() => setHandover(null)}
        onSubmit={(note) => {
          const target = handover
          if (!target) return
          void run(
            (target.mode === "end"
              ? repo.endShift(circleId, personId, target.shift.id, note)
              : repo.recordHandover(circleId, personId, target.shift.id, note)
            ).then(() => setHandover(null)),
            target.mode === "end" ? "Giliran tamat." : "Serah tugas disimpan."
          )
        }}
      />

      <ReplaceDialog
        target={replaceTarget}
        isSaving={busy}
        caregivers={caregivers}
        onClose={() => setReplaceTarget(null)}
        onSubmit={(caregiverPersonId) => {
          const target = replaceTarget
          if (!target) return
          void run(
            repo
              .replaceShift(circleId, personId, target.id, caregiverPersonId)
              .then(() => setReplaceTarget(null)),
            "Giliran diambil alih."
          )
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null)
        }}
        title="Batalkan giliran ini?"
        description={`Giliran ${cancelTarget?.caregiverName ?? ""} kekal dalam senarai sebagai dibatalkan.`}
        confirmLabel="Batalkan"
        variant="destructive"
        onConfirm={() => {
          const target = cancelTarget
          setCancelTarget(null)
          if (target) {
            void run(
              repo.cancelShift(circleId, personId, target.id),
              "Giliran dibatalkan."
            )
          }
        }}
      />
    </div>
  )
}

export function CaregiverSelect({
  caregivers,
  value,
  onChange,
  exclude,
}: {
  caregivers: CirclePerson[]
  value: string
  onChange: (id: string) => void
  exclude?: string
}) {
  return (
    <Select
      className="w-full"
      aria-label="Penjaga"
      placeholder="Pilih penjaga"
      value={value || null}
      onChange={(key) => onChange(String(key ?? ""))}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {caregivers
          .filter((p) => p.id !== exclude)
          .map((p) => (
            <SelectItem key={p.id} id={p.id}>
              {p.preferredName || p.fullName}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  )
}

/** Tambah dan sunting. Lalai: bermula sekarang, lapan jam. */
function ShiftDialog({
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
  target: CareShift | null
  caregivers: CirclePerson[]
  onSubmit: (input: CareShiftInput) => void
}) {
  const [caregiverPersonId, setCaregiverPersonId] = useState("")
  const [startsAt, setStartsAt] = useState(nowLocalInput())
  const [endsAt, setEndsAt] = useState(nowLocalInput())
  const [note, setNote] = useState("")

  // Masa kosong tidak boleh sampai ke toISOString (RangeError).
  const start = new Date(startsAt)
  const end = new Date(endsAt)
  const timesValid =
    !Number.isNaN(start.getTime()) &&
    !Number.isNaN(end.getTime()) &&
    end > start
  const isValid = caregiverPersonId !== "" && timesValid

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (open) {
          const s = target ? new Date(target.startsAt) : new Date()
          const e = target
            ? new Date(target.endsAt)
            : new Date(s.getTime() + 8 * 60 * 60 * 1000)
          setCaregiverPersonId(target?.caregiverPersonId ?? "")
          setStartsAt(nowLocalInput(s))
          setEndsAt(nowLocalInput(e))
          setNote(target?.note ?? "")
        }
        onOpenChange(open)
      }}
      title={target ? "Sunting giliran" : "Tambah giliran"}
      description="Siapa jaga, dari bila hingga bila."
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
                startsAt: start.toISOString(),
                endsAt: end.toISOString(),
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
        {caregivers.length === 0 ? (
          <FieldDescription>
            Tambah ahli keluarga yang menjaga sebagai person dalam circle
            dahulu.
          </FieldDescription>
        ) : null}
      </Field>
      <Field>
        <FieldLabel htmlFor="shift-start">Mula</FieldLabel>
        <Input
          id="shift-start"
          type="datetime-local"
          value={startsAt}
          onChange={(event) => setStartsAt(event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="shift-end">Hingga</FieldLabel>
        <Input
          id="shift-end"
          type="datetime-local"
          value={endsAt}
          aria-invalid={!timesValid}
          onChange={(event) => setEndsAt(event.target.value)}
        />
        {!timesValid ? (
          <FieldDescription>
            Masa tamat mesti selepas masa mula.
          </FieldDescription>
        ) : null}
      </Field>
      <Field>
        <FieldLabel htmlFor="shift-note">Nota</FieldLabel>
        <Textarea
          id="shift-note"
          rows={2}
          value={note}
          placeholder="Contoh: bawa mak ke klinik petang"
          onChange={(event) => setNote(event.target.value)}
        />
      </Field>
    </ResponsiveDialog>
  )
}

/**
 * Tamatkan giliran (nota pilihan) atau tulis serah tugas selepas tamat (nota
 * wajib). Satu perenggan - apa yang berlaku, apa yang belum selesai.
 */
function HandoverDialog({
  target,
  isSaving,
  onClose,
  onSubmit,
}: {
  target: HandoverMode | null
  isSaving: boolean
  onClose: () => void
  onSubmit: (note: string) => void
}) {
  const [note, setNote] = useState("")
  const isEnd = target?.mode === "end"

  return (
    <ResponsiveDialog
      isOpen={Boolean(target)}
      onOpenChange={(open) => {
        if (open) setNote(target?.shift.handoverNote ?? "")
        if (!open) onClose()
      }}
      title={isEnd ? "Tamatkan giliran" : "Nota serah tugas"}
      description="Untuk penjaga seterusnya: apa yang berlaku, apa yang belum selesai, apa yang perlu diperhatikan."
      footer={
        <>
          <Button variant="outline" onPress={onClose}>
            Batal
          </Button>
          <Button
            isDisabled={isSaving || (!isEnd && note.trim() === "")}
            onPress={() => onSubmit(note.trim())}
          >
            {isEnd ? "Tamatkan" : "Simpan"}
          </Button>
        </>
      }
    >
      <Field>
        <FieldLabel htmlFor="shift-handover">Serah tugas</FieldLabel>
        <Textarea
          id="shift-handover"
          rows={4}
          value={note}
          placeholder="Contoh: Mak dah makan tengah hari. Ubat malam belum. Dia mengadu pening sikit petang tadi."
          onChange={(event) => setNote(event.target.value)}
        />
        {isEnd ? (
          <FieldDescription>
            Boleh dikosongkan dan ditulis kemudian.
          </FieldDescription>
        ) : null}
      </Field>
    </ResponsiveDialog>
  )
}

/** "Angah ganti Along": giliran asal kekal sebagai diganti. */
function ReplaceDialog({
  target,
  isSaving,
  caregivers,
  onClose,
  onSubmit,
}: {
  target: CareShift | null
  isSaving: boolean
  caregivers: CirclePerson[]
  onClose: () => void
  onSubmit: (caregiverPersonId: string) => void
}) {
  const [caregiverPersonId, setCaregiverPersonId] = useState("")

  return (
    <ResponsiveDialog
      isOpen={Boolean(target)}
      onOpenChange={(open) => {
        if (open) setCaregiverPersonId("")
        if (!open) onClose()
      }}
      title="Siapa ambil alih?"
      description={`Giliran ${target?.caregiverName ?? ""} kekal direkod sebagai diganti.`}
      footer={
        <>
          <Button variant="outline" onPress={onClose}>
            Batal
          </Button>
          <Button
            isDisabled={isSaving || caregiverPersonId === ""}
            onPress={() => onSubmit(caregiverPersonId)}
          >
            Ambil alih
          </Button>
        </>
      }
    >
      <Field>
        <FieldLabel>Pengganti</FieldLabel>
        <CaregiverSelect
          caregivers={caregivers}
          value={caregiverPersonId}
          onChange={setCaregiverPersonId}
          exclude={target?.caregiverPersonId}
        />
      </Field>
    </ResponsiveDialog>
  )
}
