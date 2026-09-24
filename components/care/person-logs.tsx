"use client"

import { useState } from "react"
import { IconNotebook, IconPencil, IconTrash } from "@tabler/icons-react"
import { toast } from "sonner"

import { useAuth } from "@/components/auth/auth-provider"
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
import { usePersonLogs } from "@/hooks/use-person-logs"
import { useDisplayFormat } from "@/lib/application/display-preferences"
import { getCareRepository } from "@/lib/composition/care-repository"
import {
  CARE_LOG_FLAG_LABELS,
  CARE_LOG_FLAGS,
  CARE_LOG_KIND_LABELS,
  CARE_LOG_KINDS,
  CARE_LOG_VISIBILITIES,
  CARE_LOG_VISIBILITY_LABELS,
  type CareLog,
  type CareLogFlag,
  type CareLogInput,
  type CareLogKind,
  type CareLogVisibility,
} from "@/lib/domain/care"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"

/** Nada ikut MAKNA: kecemasan mesti menonjol dalam senarai yang kebanyakannya biasa. */
const FLAG_TONE: Record<CareLogFlag, StatusTone> = {
  kecemasan: "critical",
  perlu_perhatian: "attention",
  biasa: "neutral",
}

/**
 * Catatan harian untuk SATU person - apa yang berlaku hari ini, bukan apa yang
 * doktor kata (itu health). Sunting milik penulis sahaja; padam milik penulis
 * atau moderator (`care.log.manage`). Pelayan tetap memutuskan: butang yang
 * disembunyikan di sini hanyalah tidak menawarkan apa yang akan ditolak.
 */
export function PersonLogs({
  circleId,
  personId,
  canCreate,
  canModerate,
}: {
  circleId: string
  personId: string
  canCreate: boolean
  canModerate: boolean
}) {
  const { user } = useAuth()
  const { dateTime } = useDisplayFormat()
  const { logs, hasMore, isLoading, error, reload, loadMore } = usePersonLogs(
    circleId,
    personId
  )
  const repo = getCareRepository()

  const [busy, setBusy] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTarget, setEditingTarget] = useState<CareLog | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CareLog | null>(null)

  async function run(action: Promise<unknown>, done: string) {
    setBusy(true)
    try {
      await action
      toast.success(done)
      await reload()
    } catch (cause) {
      toast.error(
        isApiError(cause) ? messageForApiError(cause) : "Tindakan gagal."
      )
    } finally {
      setBusy(false)
    }
  }

  const isMine = (log: CareLog) => Boolean(user && log.recordedBy === user.id)

  const helper = createDataTableColumnHelper<CareLog>()
  const columns = helper.columns([
    helper.accessor("occurredAt", {
      header: "Bila",
      cell: ({ getValue }) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {dateTime(getValue())}
        </span>
      ),
    }),
    helper.accessor((row) => `${row.title ?? ""} ${row.body ?? ""}`, {
      id: "content",
      header: "Catatan",
      cell: ({ row }) => {
        const { title, body, recordedByLabel } = row.original
        return (
          <div className="min-w-0 space-y-0.5">
            {title ? <p className="font-medium">{title}</p> : null}
            {body ? (
              <p className="line-clamp-3 text-sm whitespace-pre-line">{body}</p>
            ) : null}
            {!title && !body ? (
              <p className="text-sm text-muted-foreground italic">
                Kandungan tidak dikongsi dengan anda.
              </p>
            ) : null}
            {recordedByLabel ? (
              <p className="text-xs text-muted-foreground">
                oleh {recordedByLabel}
              </p>
            ) : null}
          </div>
        )
      },
    }),
    helper.accessor("kind", {
      header: "Jenis",
      filterFn: "equalsString",
      cell: ({ getValue }) => (
        <StatusChip tone="neutral" label={CARE_LOG_KIND_LABELS[getValue()]} />
      ),
    }),
    helper.accessor("flag", {
      header: "Penanda",
      filterFn: "equalsString",
      cell: ({ getValue }) => (
        <StatusChip
          tone={FLAG_TONE[getValue()]}
          label={CARE_LOG_FLAG_LABELS[getValue()]}
        />
      ),
    }),
    helper.accessor("visibility", {
      header: "Siapa nampak",
      filterFn: "equalsString",
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">
          {CARE_LOG_VISIBILITY_LABELS[getValue()]}
        </span>
      ),
    }),
    helper.display({
      id: "action",
      header: () => <span className="flex justify-end">Tindakan</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const mine = isMine(row.original)
        if (!mine && !canModerate) return null
        return (
          <TableActions>
            {mine ? (
              <TableActionButton
                isDisabled={busy}
                onPress={() => {
                  setEditingTarget(row.original)
                  setIsDialogOpen(true)
                }}
              >
                <IconPencil />
                Sunting
              </TableActionButton>
            ) : null}
            <TableActionButton
              tone="danger"
              aria-label="Padam catatan"
              isDisabled={busy}
              onPress={() => setDeleteTarget(row.original)}
            >
              <IconTrash />
              Padam
            </TableActionButton>
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
        label="Gagal memuatkan catatan penjagaan."
      />

      <DataTable
        columns={columns}
        data={logs}
        getRowId={(row) => row.id}
        isLoading={isLoading && logs.length === 0}
        pageSize={10}
        addLabel="Tulis catatan"
        onAdd={
          canCreate && !error
            ? () => {
                setEditingTarget(null)
                setIsDialogOpen(true)
              }
            : undefined
        }
        toolbarStart={
          <p className="text-sm text-muted-foreground">
            Apa yang berlaku hari ini, terbaharu di atas.
          </p>
        }
        emptyIcon={<IconNotebook />}
        emptyTitle="Tiada catatan"
        emptyDescription="Makan, tidur, mood, apa-apa yang berlaku - supaya ia tidak hilang dalam WhatsApp."
      />

      {hasMore ? (
        <Button
          variant="outline"
          className="self-center"
          isDisabled={isLoading}
          onPress={() => void loadMore()}
        >
          Muat catatan lebih lama
        </Button>
      ) : null}

      <LogDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        isSaving={busy}
        target={editingTarget}
        onSubmit={(input) => {
          const action = editingTarget
            ? repo.updateLog(circleId, personId, editingTarget.id, input)
            : repo.createLog(circleId, personId, input)
          void run(
            action.then(() => {
              setIsDialogOpen(false)
              setEditingTarget(null)
            }),
            editingTarget ? "Catatan disunting." : "Catatan direkodkan."
          )
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Padam catatan ini?"
        description={
          deleteTarget && !isMine(deleteTarget)
            ? `Catatan ${deleteTarget.recordedByLabel ?? "ahli lain"} dibuang daripada garis masa. Jejak audit kekal.`
            : "Catatan dibuang daripada garis masa. Jejak audit kekal."
        }
        confirmLabel="Padam"
        variant="destructive"
        onConfirm={() => {
          const target = deleteTarget
          setDeleteTarget(null)
          if (target) {
            void run(
              repo.deleteLog(circleId, personId, target.id),
              "Catatan dipadam."
            )
          }
        }}
      />
    </div>
  )
}

/**
 * Borang tulis dan sunting. `target` null bermakna tulis baharu. Masa berlaku
 * lalai kepada SEKARANG tetapi boleh diundur: penjaga menulis pada malam hari
 * tentang apa yang berlaku tengah hari.
 */
function LogDialog({
  isOpen,
  onOpenChange,
  isSaving,
  target,
  onSubmit,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isSaving: boolean
  target: CareLog | null
  onSubmit: (input: CareLogInput) => void
}) {
  const [kind, setKind] = useState<CareLogKind>("nota")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [flag, setFlag] = useState<CareLogFlag>("biasa")
  const [visibility, setVisibility] = useState<CareLogVisibility>("circle")
  const [occurredAt, setOccurredAt] = useState(nowLocalInput())

  // Masa kosong atau tidak sah tidak boleh sampai ke toISOString (RangeError).
  const occurred = new Date(occurredAt)
  const isValid =
    (title.trim() !== "" || body.trim() !== "") &&
    !Number.isNaN(occurred.getTime())

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (open) {
          setKind(target?.kind ?? "nota")
          setTitle(target?.title ?? "")
          setBody(target?.body ?? "")
          setFlag(target?.flag ?? "biasa")
          setVisibility(target?.visibility ?? "circle")
          setOccurredAt(
            nowLocalInput(target ? new Date(target.occurredAt) : new Date())
          )
        }
        onOpenChange(open)
      }}
      title={target ? "Sunting catatan" : "Tulis catatan"}
      description="Apa yang dilihat, apa yang dibuat - ayat biasa sudah cukup."
      footer={
        <>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            isDisabled={isSaving || !isValid}
            onPress={() =>
              onSubmit({
                kind,
                title: title.trim(),
                body: body.trim(),
                flag,
                visibility,
                occurredAt: occurred.toISOString(),
              })
            }
          >
            Simpan
          </Button>
        </>
      }
    >
      <Field>
        <FieldLabel htmlFor="log-body">Catatan</FieldLabel>
        <Textarea
          id="log-body"
          rows={4}
          value={body}
          placeholder="Contoh: Mak tak makan tengah hari, kata pening. Bagi Panadol pukul 3."
          onChange={(event) => setBody(event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="log-title">Tajuk</FieldLabel>
        <Input
          id="log-title"
          value={title}
          maxLength={160}
          placeholder="Pilihan - contoh: Jatuh di bilik air"
          onChange={(event) => setTitle(event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="log-occurred">Bila berlaku</FieldLabel>
        <Input
          id="log-occurred"
          type="datetime-local"
          value={occurredAt}
          onChange={(event) => setOccurredAt(event.target.value)}
        />
        <FieldDescription>Masa hadapan ditolak oleh pelayan.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Jenis</FieldLabel>
        <Select
          className="w-full"
          aria-label="Jenis catatan"
          value={kind}
          onChange={(key) => setKind(String(key ?? "nota") as CareLogKind)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CARE_LOG_KINDS.map((key) => (
              <SelectItem key={key} id={key}>
                {CARE_LOG_KIND_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel>Penanda</FieldLabel>
        <Select
          className="w-full"
          aria-label="Penanda catatan"
          value={flag}
          onChange={(key) => setFlag(String(key ?? "biasa") as CareLogFlag)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CARE_LOG_FLAGS.map((key) => (
              <SelectItem key={key} id={key}>
                {CARE_LOG_FLAG_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldDescription>
          Kecemasan memberitahu circle - kecuali catatan &quot;Saya
          sahaja&quot;.
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Siapa nampak</FieldLabel>
        <Select
          className="w-full"
          aria-label="Siapa nampak catatan"
          value={visibility}
          onChange={(key) =>
            setVisibility(String(key ?? "circle") as CareLogVisibility)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CARE_LOG_VISIBILITIES.map((key) => (
              <SelectItem key={key} id={key}>
                {CARE_LOG_VISIBILITY_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldDescription>
          &quot;Saya sahaja&quot; untuk pemerhatian yang belum pasti - tetap
          tercatat dalam audit.
        </FieldDescription>
      </Field>
    </ResponsiveDialog>
  )
}
