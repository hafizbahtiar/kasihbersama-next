"use client"

import { useCallback, useEffect, useState } from "react"
import { IconTrash, IconUsers } from "@tabler/icons-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { createDataTableColumnHelper, DataTable } from "@/components/data-table"
import { ResponsiveDialog } from "@/components/responsive-dialog"
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
import { useCirclePersons } from "@/hooks/use-circle-persons"
import { getCircleRepository } from "@/lib/composition/circle-repository"
import {
  RELATIONSHIP_KIND_LABELS,
  type PersonRelationship,
  type RelationshipKind,
} from "@/lib/domain/circle"
import {
  ApiError,
  isApiError,
  messageForApiError,
} from "@/lib/infrastructure/api/errors"

const KINDS = Object.keys(RELATIONSHIP_KIND_LABELS) as RelationshipKind[]

/**
 * Hubungan seorang person dengan person lain dalam circle yang sama. Pelayan
 * menulis arah songsang sendiri: "orang ini ialah ibu kepada Aminah" muncul
 * sebagai "anak" pada rekod Aminah.
 */
export function PersonRelationships({
  circleId,
  personId,
  canWrite,
}: {
  circleId: string
  personId: string
  canWrite: boolean
}) {
  const repo = getCircleRepository()
  const persons = useCirclePersons(circleId, canWrite)
  const [data, setData] = useState<PersonRelationship[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [busy, setBusy] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [relatedId, setRelatedId] = useState("")
  const [kind, setKind] = useState<RelationshipKind>("parent")
  const [label, setLabel] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<PersonRelationship | null>(
    null
  )

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setData(await getCircleRepository().listRelationships(circleId, personId))
    } catch (cause) {
      setError(
        isApiError(cause)
          ? cause
          : new ApiError("Gagal memuatkan hubungan.", {
              code: "internal",
              status: 500,
            })
      )
    } finally {
      setIsLoading(false)
    }
  }, [circleId, personId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  async function run(action: Promise<unknown>, done: string) {
    setBusy(true)
    try {
      await action
      toast.success(done)
      await load()
      return true
    } catch (cause) {
      toast.error(
        isApiError(cause) ? messageForApiError(cause) : "Tindakan gagal."
      )
      return false
    } finally {
      setBusy(false)
    }
  }

  async function save() {
    const ok = await run(
      repo.createRelationship(circleId, personId, {
        relatedPersonId: relatedId,
        kind,
        label: label.trim() || undefined,
      }),
      "Hubungan ditambah."
    )
    if (ok) {
      setIsOpen(false)
      setRelatedId("")
      setLabel("")
    }
  }

  const helper = createDataTableColumnHelper<PersonRelationship>()
  const columns = helper.columns([
    // Row dibaca "orang ini ialah <kind> kepada <nama>" (docs/02: (A, B, parent) = A ibu B).
    helper.accessor((row) => RELATIONSHIP_KIND_LABELS[row.kind] ?? row.kind, {
      id: "kind",
      header: "Orang ini ialah",
      filterFn: "equalsString",
      cell: ({ row }) => (
        <span>
          {RELATIONSHIP_KIND_LABELS[row.original.kind] ?? row.original.kind}
          {row.original.label ? (
            <span className="text-muted-foreground">
              {" "}
              · {row.original.label}
            </span>
          ) : null}
        </span>
      ),
    }),
    helper.accessor("relatedPersonName", { header: "Kepada" }),
    helper.display({
      id: "action",
      header: () => <span className="flex justify-end">Tindakan</span>,
      enableSorting: false,
      cell: ({ row }) =>
        canWrite ? (
          <TableActions>
            <TableActionButton
              tone="danger"
              aria-label={`Padam hubungan dengan ${row.original.relatedPersonName}`}
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

  const candidates = persons.data.filter((p) => p.id !== personId)

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        errorMessage={error ? messageForApiError(error) : undefined}
        onRetry={() => void load()}
        addLabel="Tambah hubungan"
        onAdd={canWrite ? () => setIsOpen(true) : undefined}
        showColumnToggle={false}
        toolbarStart={
          <h2 className="font-heading text-lg tracking-tight">Hubungan</h2>
        }
        emptyIcon={<IconUsers />}
        emptyTitle="Tiada hubungan"
        emptyDescription="Hubungkan orang ini dengan ahli keluarga lain dalam circle."
      />

      <ResponsiveDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        title="Tambah hubungan"
        description="Arah sebaliknya ditambah sendiri pada rekod orang itu."
        footer={
          <>
            <Button variant="outline" onPress={() => setIsOpen(false)}>
              Batal
            </Button>
            <Button isDisabled={busy || !relatedId} onPress={() => void save()}>
              Simpan
            </Button>
          </>
        }
      >
        <Field>
          <FieldLabel>Orang</FieldLabel>
          <Select
            className="w-full"
            aria-label="Orang berkaitan"
            value={relatedId || null}
            onChange={(key) => setRelatedId(String(key ?? ""))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {candidates.map((p) => (
                <SelectItem key={p.id} id={p.id}>
                  {p.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Hubungan</FieldLabel>
          <Select
            className="w-full"
            aria-label="Jenis hubungan"
            value={kind}
            onChange={(key) =>
              setKind(String(key ?? "other") as RelationshipKind)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KINDS.map((k) => (
                <SelectItem key={k} id={k}>
                  {RELATIONSHIP_KIND_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription>
            Orang ini ialah {RELATIONSHIP_KIND_LABELS[kind].toLowerCase()}{" "}
            kepada orang yang dipilih.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="relationship-label">Label (pilihan)</FieldLabel>
          <Input
            id="relationship-label"
            value={label}
            maxLength={40}
            placeholder="cth. ibu tiri"
            onChange={(e) => setLabel(e.target.value)}
          />
        </Field>
      </ResponsiveDialog>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setDeleteTarget(null)
          }
        }}
        title="Padam hubungan?"
        description={`Hubungan dengan ${deleteTarget?.relatedPersonName ?? "orang itu"} dibuang dari kedua-dua rekod.`}
        confirmLabel="Padam"
        variant="destructive"
        icon={<IconTrash />}
        onConfirm={() => {
          const target = deleteTarget
          setDeleteTarget(null)
          if (target) {
            void run(
              repo.deleteRelationship(circleId, personId, target.id),
              "Hubungan dipadam."
            )
          }
        }}
      />
    </>
  )
}
