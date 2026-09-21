"use client"

import { useCallback, useEffect, useState } from "react"
import { IconMapPin, IconTrash } from "@tabler/icons-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { createDataTableColumnHelper, DataTable } from "@/components/data-table"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { TableActionButton, TableActions } from "@/components/table-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getCircleRepository } from "@/lib/composition/circle-repository"
import type { PersonAddress, PersonAddressInput } from "@/lib/domain/circle"
import {
  ApiError,
  isApiError,
  messageForApiError,
} from "@/lib/infrastructure/api/errors"

const EMPTY: PersonAddressInput = {
  label: "",
  line1: "",
  line2: "",
  city: "",
  postcode: "",
  state: "",
  country: "MY",
  notes: "",
  isPrimary: false,
}

/** Kosong → undefined: pelayan mengisi lalai (label "rumah", negara "MY"). */
function clean(input: PersonAddressInput): PersonAddressInput {
  const opt = (v?: string) => v?.trim() || undefined
  return {
    label: input.label.trim(),
    line1: input.line1.trim(),
    line2: opt(input.line2),
    city: input.city.trim(),
    postcode: opt(input.postcode),
    state: opt(input.state),
    country: input.country.trim().toUpperCase(),
    notes: opt(input.notes),
    isPrimary: input.isPrimary,
  }
}

/**
 * Alamat seorang person (`person_addresses`). Pelayan hanya melayan akses PENUH,
 * jadi pembaca ringkasan melihat ralat penafian dalam jadual, bukan senarai kosong.
 */
export function PersonAddresses({
  circleId,
  personId,
  canWrite,
}: {
  circleId: string
  personId: string
  canWrite: boolean
}) {
  const repo = getCircleRepository()
  const [data, setData] = useState<PersonAddress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState<PersonAddress | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState<PersonAddressInput>(EMPTY)
  const [deleteTarget, setDeleteTarget] = useState<PersonAddress | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setData(await getCircleRepository().listAddresses(circleId, personId))
    } catch (cause) {
      setError(
        isApiError(cause)
          ? cause
          : new ApiError("Gagal memuatkan alamat.", {
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

  function open(address: PersonAddress | null) {
    setEditing(address)
    setDraft(address ? { ...EMPTY, ...address } : EMPTY)
    setIsOpen(true)
  }

  async function save() {
    const input = clean(draft)
    const ok = await run(
      editing
        ? repo.updateAddress(circleId, personId, editing.id, input)
        : repo.createAddress(circleId, personId, input),
      editing ? "Alamat dikemas kini." : "Alamat ditambah."
    )
    if (ok) {
      setIsOpen(false)
    }
  }

  const set = (patch: Partial<PersonAddressInput>) =>
    setDraft({ ...draft, ...patch })

  const helper = createDataTableColumnHelper<PersonAddress>()
  const columns = helper.columns([
    helper.accessor("label", {
      header: "Label",
      cell: ({ row }) => (
        <span className="flex items-center gap-2 capitalize">
          {row.original.label}
          {row.original.isPrimary ? (
            <Badge variant="secondary">Utama</Badge>
          ) : null}
        </span>
      ),
    }),
    helper.accessor(
      (row) =>
        [row.line1, row.line2, row.postcode, row.city, row.state]
          .filter(Boolean)
          .join(", "),
      { id: "address", header: "Alamat" }
    ),
    helper.accessor("country", { header: "Negara" }),
    helper.display({
      id: "action",
      header: () => <span className="flex justify-end">Tindakan</span>,
      enableSorting: false,
      cell: ({ row }) =>
        canWrite ? (
          <TableActions>
            <TableActionButton
              isDisabled={busy}
              onPress={() => open(row.original)}
            >
              Sunting
            </TableActionButton>
            <TableActionButton
              tone="danger"
              aria-label={`Padam alamat ${row.original.label}`}
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
    <>
      <DataTable
        columns={columns}
        data={data}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        errorMessage={error ? messageForApiError(error) : undefined}
        onRetry={() => void load()}
        addLabel="Tambah alamat"
        onAdd={canWrite ? () => open(null) : undefined}
        showColumnToggle={false}
        toolbarStart={
          <h2 className="font-heading text-lg tracking-tight">Alamat</h2>
        }
        emptyIcon={<IconMapPin />}
        emptyTitle="Tiada alamat"
        emptyDescription="Tambah alamat rumah atau tempat lain orang ini boleh ditemui."
      />

      <ResponsiveDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        title={editing ? "Sunting alamat" : "Tambah alamat"}
        footer={
          <>
            <Button variant="outline" onPress={() => setIsOpen(false)}>
              Batal
            </Button>
            <Button
              isDisabled={busy || !draft.line1.trim() || !draft.city.trim()}
              onPress={() => void save()}
            >
              Simpan
            </Button>
          </>
        }
      >
        <Field>
          <FieldLabel htmlFor="address-label">Label</FieldLabel>
          <Input
            id="address-label"
            value={draft.label}
            placeholder="rumah"
            maxLength={40}
            onChange={(e) => set({ label: e.target.value })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="address-line1">Alamat baris 1</FieldLabel>
          <Input
            id="address-line1"
            value={draft.line1}
            maxLength={160}
            onChange={(e) => set({ line1: e.target.value })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="address-line2">Alamat baris 2</FieldLabel>
          <Input
            id="address-line2"
            value={draft.line2 ?? ""}
            maxLength={160}
            onChange={(e) => set({ line2: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="address-postcode">Poskod</FieldLabel>
            <Input
              id="address-postcode"
              value={draft.postcode ?? ""}
              maxLength={12}
              onChange={(e) => set({ postcode: e.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="address-city">Bandar</FieldLabel>
            <Input
              id="address-city"
              value={draft.city}
              maxLength={80}
              onChange={(e) => set({ city: e.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="address-state">Negeri</FieldLabel>
            <Input
              id="address-state"
              value={draft.state ?? ""}
              maxLength={60}
              onChange={(e) => set({ state: e.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="address-country">Negara (kod)</FieldLabel>
            <Input
              id="address-country"
              value={draft.country}
              maxLength={2}
              onChange={(e) => set({ country: e.target.value })}
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="address-notes">Nota</FieldLabel>
          <Textarea
            id="address-notes"
            value={draft.notes ?? ""}
            onChange={(e) => set({ notes: e.target.value })}
          />
        </Field>
        <Field orientation="horizontal" className="items-center">
          <Checkbox
            id="address-primary"
            isSelected={draft.isPrimary}
            onChange={(isPrimary) => set({ isPrimary })}
          />
          <FieldLabel htmlFor="address-primary" className="font-normal">
            Alamat utama
          </FieldLabel>
        </Field>
      </ResponsiveDialog>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setDeleteTarget(null)
          }
        }}
        title="Padam alamat?"
        description="Alamat ini dibuang daripada rekod orang ini."
        confirmLabel="Padam"
        variant="destructive"
        icon={<IconTrash />}
        onConfirm={() => {
          const target = deleteTarget
          setDeleteTarget(null)
          if (target) {
            void run(
              repo.deleteAddress(circleId, personId, target.id),
              "Alamat dipadam."
            )
          }
        }}
      />
    </>
  )
}
