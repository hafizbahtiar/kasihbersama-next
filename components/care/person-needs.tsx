"use client"

import { useState } from "react"
import { IconClipboardList, IconPencil, IconTrash } from "@tabler/icons-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { createDataTableColumnHelper, DataTable } from "@/components/data-table"
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
import { getCareRepository } from "@/lib/composition/care-repository"
import {
  CARE_NEED_CATEGORIES,
  CARE_NEED_CATEGORY_LABELS,
  CARE_NEED_PRIORITIES,
  CARE_NEED_PRIORITY_LABELS,
  type CareNeed,
  type CareNeedCategory,
  type CareNeedPriority,
} from "@/lib/domain/care"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"
import { usePersonNeeds } from "@/hooks/use-person-needs"

/** Nada cip mengikut MAKNA: kritikal ialah perkara yang penjaga ganti mesti nampak dahulu. */
const PRIORITY_TONE: Record<CareNeedPriority, StatusTone> = {
  kritikal: "critical",
  penting: "attention",
  biasa: "neutral",
}

/**
 * Arahan tetap untuk SATU person - apa yang penjaga ganti mesti tahu sebelum
 * mengambil alih. Data dimuat oleh komponen ini sendiri (bukan bersama health):
 * care ialah module berasingan, dan tab ini ialah ruang kerja kedua dalam
 * skrin person.
 */
export function PersonNeeds({
  circleId,
  personId,
  canWrite,
}: {
  circleId: string
  personId: string
  /** Akses ringkasan membaca sahaja - pelayan menolak tulisan, UI tidak menawarkannya. */
  canWrite: boolean
}) {
  const { needs, isLoading, error, reload } = usePersonNeeds(circleId, personId)
  const repo = getCareRepository()

  const [busy, setBusy] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTarget, setEditingTarget] = useState<CareNeed | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CareNeed | null>(null)

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

  const helper = createDataTableColumnHelper<CareNeed>()
  const columns = helper.columns([
    helper.accessor("instruction", {
      header: "Arahan",
      cell: ({ row }) => (
        <div className="min-w-0 space-y-0.5">
          <p className="font-medium">{row.original.instruction}</p>
          {row.original.note ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {row.original.note}
            </p>
          ) : null}
        </div>
      ),
    }),
    helper.accessor("category", {
      header: "Kategori",
      filterFn: "equalsString",
      cell: ({ getValue }) => (
        <StatusChip
          tone="neutral"
          label={CARE_NEED_CATEGORY_LABELS[getValue()]}
        />
      ),
    }),
    helper.accessor("priority", {
      header: "Keutamaan",
      filterFn: "equalsString",
      cell: ({ getValue }) => (
        <StatusChip
          tone={PRIORITY_TONE[getValue()]}
          label={CARE_NEED_PRIORITY_LABELS[getValue()]}
        />
      ),
    }),
    helper.accessor((row) => (row.isActive ? "aktif" : "tutup"), {
      id: "status",
      header: "Status",
      filterFn: "equalsString",
      cell: ({ row }) => (
        <StatusChip
          tone={row.original.isActive ? "positive" : "neutral"}
          label={row.original.isActive ? "Aktif" : "Ditutup"}
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
              onPress={() => setEditingTarget(row.original)}
            >
              <IconPencil />
              Sunting
            </TableActionButton>
            {row.original.isActive ? (
              <TableActionButton
                isDisabled={busy}
                onPress={() => {
                  void run(
                    repo.updateNeed(circleId, personId, row.original.id, {
                      isActive: false,
                    }),
                    "Arahan ditutup."
                  )
                }}
              >
                Tutup
              </TableActionButton>
            ) : (
              <TableActionButton
                isDisabled={busy}
                onPress={() => {
                  void run(
                    repo.updateNeed(circleId, personId, row.original.id, {
                      isActive: true,
                    }),
                    "Arahan diaktifkan semula."
                  )
                }}
              >
                Aktifkan
              </TableActionButton>
            )}
            <TableActionButton
              tone="danger"
              aria-label={`Padam arahan ${row.original.instruction}`}
              isDisabled={busy}
              onPress={() => setDeleteTarget(row.original)}
            >
              <IconTrash />
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
        onRetry={() => void reload()}
        label="Gagal memuatkan arahan tetap."
      />

      <DataTable
        columns={columns}
        data={needs}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        pageSize={5}
        addLabel="Rekod arahan"
        onAdd={
          canWrite && !error
            ? () => {
                setEditingTarget(null)
                setIsDialogOpen(true)
              }
            : undefined
        }
        toolbarStart={
          <p className="text-sm text-muted-foreground">
            Arahan tetap penjaga ganti. Yang kritikal di atas; yang ditutup kekal
            sebagai sejarah.
          </p>
        }
        emptyIcon={<IconClipboardList />}
        emptyTitle="Tiada arahan tetap"
        emptyDescription="Perlu dipapah ke tandas, tidak boleh makan makanan keras - apa yang penjaga ganti mesti tahu."
      />

      {/* Dialog kekal DI LUAR <DataTable>: lihat AGENTS.md - portal yang
          terlepas daripada laluan koleksi tersembunyi menutup dirinya sendiri. */}
      <NeedDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        isSaving={busy}
        target={editingTarget}
        onSubmit={(input) => {
          const action = editingTarget
            ? repo.updateNeed(circleId, personId, editingTarget.id, {
                category: input.category,
                instruction: input.instruction,
                priority: input.priority,
                note: input.note,
              })
            : repo.createNeed(circleId, personId, input)
          void run(
            action.then(() => {
              setIsDialogOpen(false)
              setEditingTarget(null)
            }),
            editingTarget ? "Arahan disunting." : "Arahan direkodkan."
          )
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
        title="Padam arahan ini?"
        description={`${deleteTarget?.instruction ?? "Arahan"} dibuang terus. Untuk menyimpan sejarah, tutup arahan sebaliknya.`}
        confirmLabel="Padam"
        variant="destructive"
        onConfirm={() => {
          const target = deleteTarget
          setDeleteTarget(null)
          if (target) {
            void run(
              repo.deleteNeed(circleId, personId, target.id),
              "Arahan dipadam."
            )
          }
        }}
      />
    </div>
  )
}

/**
 * Borang tambah dan sunting. `target` null bermakna tambah; bukan null bermakna
 * sunting. Borang dibuka semula dengan apa yang TERSIMPAN, bukan suntingan yang
 * ditinggalkan separuh jalan.
 */
function NeedDialog({
  isOpen,
  onOpenChange,
  isSaving,
  target,
  onSubmit,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isSaving: boolean
  target: CareNeed | null
  onSubmit: (input: {
    category: CareNeedCategory
    instruction: string
    priority: CareNeedPriority
    note?: string
  }) => void
}) {
  const [category, setCategory] = useState<CareNeedCategory>("mobiliti")
  const [instruction, setInstruction] = useState("")
  const [priority, setPriority] = useState<CareNeedPriority>("biasa")
  const [note, setNote] = useState("")

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        // Membuka semula mesti menunjukkan sasaran semasa, bukan borang lama.
        if (open) {
          setCategory(target?.category ?? "mobiliti")
          setInstruction(target?.instruction ?? "")
          setPriority(target?.priority ?? "biasa")
          setNote(target?.note ?? "")
        }
        onOpenChange(open)
      }}
      title={target ? "Sunting arahan tetap" : "Rekod arahan tetap"}
      description="Ayat yang penjaga ganti boleh ikut terus - bukan kod."
      footer={
        <>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            isDisabled={
              isSaving || instruction.trim().length === 0
            }
            onPress={() => {
              onSubmit({
                category,
                instruction: instruction.trim(),
                priority,
                note: note.trim(),
              })
              setInstruction("")
              setNote("")
            }}
          >
            Simpan
          </Button>
        </>
      }
    >
      <Field>
        <FieldLabel htmlFor="need-instruction">Arahan</FieldLabel>
        <Input
          id="need-instruction"
          value={instruction}
          placeholder="Contoh: perlu dipapah ke tandas"
          onChange={(event) => setInstruction(event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel>Kategori</FieldLabel>
        <Select
          className="w-full"
          aria-label="Kategori arahan"
          value={category}
          onChange={(key) =>
            setCategory(String(key ?? "mobiliti") as CareNeedCategory)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CARE_NEED_CATEGORIES.map((key) => (
              <SelectItem key={key} id={key}>
                {CARE_NEED_CATEGORY_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel>Keutamaan</FieldLabel>
        <Select
          className="w-full"
          aria-label="Keutamaan arahan"
          value={priority}
          onChange={(key) =>
            setPriority(String(key ?? "biasa") as CareNeedPriority)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CARE_NEED_PRIORITIES.map((key) => (
              <SelectItem key={key} id={key}>
                {CARE_NEED_PRIORITY_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldDescription>
          Kritikal muncul di atas setiap senarai - contohnya sesuatu yang
          berbahaya jika terlepas.
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="need-note">Nota</FieldLabel>
        <Textarea
          id="need-note"
          rows={2}
          value={note}
          placeholder="Contoh: pegang siku kiri semasa memapah"
          onChange={(event) => setNote(event.target.value)}
        />
      </Field>
    </ResponsiveDialog>
  )
}