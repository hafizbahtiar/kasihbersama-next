"use client"

import { useCallback, useState } from "react"
import {
  IconPencil,
  IconShieldLock,
  IconTrash,
  IconUsers,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { PersonAccessDialog } from "@/components/circles/person-access-dialog"
import { PersonEditDialog } from "@/components/circles/person-edit-dialog"
import { createDataTableColumnHelper, DataTable } from "@/components/data-table"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { StatusChip } from "@/components/status-chip"
import { TableActionButton, TableActions } from "@/components/table-actions"
import { Button, LinkButton } from "@/components/ui/button"
import { DateField } from "@/components/ui/date-field"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
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
  ACCESS_LEVEL_LABELS,
  SEX_OPTIONS,
  sexLabel,
  type CircleMember,
  type CirclePerson,
} from "@/lib/domain/circle"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"

/** Sentinel: the Select needs an id, and "not stated" is a real choice. */
const NO_SEX = "none"

/**
 * The people this circle keeps records about.
 *
 * Distinct from members on purpose: a member is an account, a person is a
 * subject - a child, a parent - and most persons never have an account at all.
 * Who sees which person is `person_access`, which is why the list can be
 * shorter than the circle's people and why the access dialog lives here.
 */
export function PersonsSection({
  circleId,
  members,
  canRead,
  canCreate,
  canUpdate,
  canDelete,
  canShare,
}: {
  circleId: string
  members: CircleMember[]
  canRead: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
  canShare: boolean
}) {
  const persons = useCirclePersons(circleId, canRead)
  const [busy, setBusy] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<CirclePerson | null>(null)
  const [accessTarget, setAccessTarget] = useState<CirclePerson | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CirclePerson | null>(null)

  const [fullName, setFullName] = useState("")
  const [preferredName, setPreferredName] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [sex, setSex] = useState("")

  const run = useCallback(
    async (action: Promise<unknown>, done: string) => {
      setBusy(true)
      try {
        await action
        toast.success(done)
        await persons.reload()
      } catch (cause) {
        toast.error(
          isApiError(cause) ? messageForApiError(cause) : "Tindakan gagal."
        )
      } finally {
        setBusy(false)
      }
    },
    [persons]
  )

  // Tanpa useMemo: React Compiler yang memoize komponen ini (lihat circle-detail).
  const helper = createDataTableColumnHelper<CirclePerson>()
  const columns = helper.columns([
    helper.accessor("fullName", {
      header: "Nama",
      cell: ({ row }) => (
        <div className="min-w-0 space-y-0.5">
          <p className="font-medium">{row.original.fullName}</p>
          {row.original.preferredName ? (
            <p className="truncate text-xs text-muted-foreground">
              {row.original.preferredName}
            </p>
          ) : null}
        </div>
      ),
    }),
    helper.accessor("ageYears", {
      header: "Umur",
      cell: ({ getValue }) => {
        const age = getValue()
        return (
          <span className="text-muted-foreground">
            {typeof age === "number" ? `${age} tahun` : "—"}
          </span>
        )
      },
    }),
    helper.accessor((row) => (row.sex ? sexLabel(row.sex) : ""), {
      id: "sex",
      header: "Jantina",
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{getValue() || "—"}</span>
      ),
    }),
    helper.accessor((row) => row.accessLevel, {
      id: "accessLevel",
      header: "Akses anda",
      filterFn: "equalsString",
      cell: ({ getValue }) => (
        <StatusChip
          tone={getValue() === "full" ? "positive" : "neutral"}
          label={ACCESS_LEVEL_LABELS[getValue()]}
        />
      ),
    }),
    helper.display({
      id: "action",
      header: () => <span className="flex justify-end">Tindakan</span>,
      enableSorting: false,
      cell: ({ row }) =>
        canUpdate || canShare || canDelete ? (
          <TableActions>
            {/* Rekod kesihatan ialah halamannya sendiri: ia mengandungi tiga
                senarai, dan tiga senarai dalam satu dialog ialah dialog yang
                tiada siapa boleh baca. */}
            <LinkButton
              href={`/circles/${circleId}/persons/${row.original.id}`}
              variant="outline"
              size="sm"
              className="px-2"
            >
              Kesihatan
            </LinkButton>
            {canUpdate ? (
              <TableActionButton
                aria-label={`Kemas kini ${row.original.fullName}`}
                isDisabled={busy}
                onPress={() => setEditTarget(row.original)}
              >
                <IconPencil />
                Kemas kini
              </TableActionButton>
            ) : null}
            {canShare ? (
              <TableActionButton
                aria-label={`Akses kepada ${row.original.fullName}`}
                isDisabled={busy}
                onPress={() => setAccessTarget(row.original)}
              >
                <IconShieldLock />
                Akses
              </TableActionButton>
            ) : null}
            {canDelete ? (
              <TableActionButton
                aria-label={`Padam ${row.original.fullName}`}
                isDisabled={busy}
                onPress={() => setDeleteTarget(row.original)}
              >
                <IconTrash />
                Padam
              </TableActionButton>
            ) : null}
          </TableActions>
        ) : null,
    }),
  ])

  if (!canRead) {
    return null
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={persons.data}
        getRowId={(row) => row.id}
        isLoading={persons.isLoading}
        errorMessage={
          persons.error ? messageForApiError(persons.error) : undefined
        }
        onRetry={() => {
          void persons.reload()
        }}
        searchable
        searchPlaceholder="Cari person..."
        pageSize={10}
        filter={{
          columnId: "accessLevel",
          label: "Akses",
          options: [
            { label: "Semua", value: "all" },
            { label: "Penuh", value: "full" },
            { label: "Ringkasan", value: "summary" },
          ],
        }}
        addLabel="Tambah orang"
        onAdd={canCreate ? () => setIsCreateOpen(true) : undefined}
        toolbarStart={
          <div className="space-y-1">
            <h2 className="font-heading text-lg tracking-tight">Orang</h2>
            <p className="text-sm text-muted-foreground">
              Sesiapa yang circle ini simpan rekodnya - dengan atau tanpa akaun.
              Senarai ini hanya menunjukkan yang anda ada akses.
            </p>
          </div>
        }
        emptyIcon={<IconUsers />}
        emptyTitle="Tiada orang"
        emptyDescription="Tambah seseorang untuk mula menyimpan rekod."
      />

      {isCreateOpen ? (
        <ResponsiveDialog
          isOpen
          onOpenChange={setIsCreateOpen}
          title="Tambah orang"
          description="Rekod ini untuk seseorang dalam circle, dengan atau tanpa akaun."
          footer={
            <>
              <Button variant="outline" onPress={() => setIsCreateOpen(false)}>
                Batal
              </Button>
              <Button
                isDisabled={busy || fullName.trim().length === 0}
                onPress={() => {
                  void run(
                    getCircleRepository()
                      .createPerson(circleId, {
                        fullName: fullName.trim(),
                        preferredName: preferredName.trim() || undefined,
                        dateOfBirth: dateOfBirth || undefined,
                        sex: sex || undefined,
                      })
                      .then(() => {
                        setFullName("")
                        setPreferredName("")
                        setDateOfBirth("")
                        setSex("")
                        setIsCreateOpen(false)
                      }),
                    "Orang ditambah."
                  )
                }}
              >
                Tambah
              </Button>
            </>
          }
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="new-person-name">Nama penuh</FieldLabel>
              <Input
                id="new-person-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-person-preferred">
                Nama panggilan
              </FieldLabel>
              <Input
                id="new-person-preferred"
                value={preferredName}
                placeholder="Pilihan"
                onChange={(event) => setPreferredName(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Tarikh lahir</FieldLabel>
              <DateField
                aria-label="Tarikh lahir"
                value={dateOfBirth}
                onChange={setDateOfBirth}
              />
              <FieldDescription>
                Pilihan. Umur dikira daripadanya untuk ahli bertahap ringkasan.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel>Jantina</FieldLabel>
              <Select
                className="w-full"
                aria-label="Jantina"
                value={sex === "" ? NO_SEX : sex}
                onChange={(key) => {
                  const next = String(key ?? NO_SEX)
                  setSex(next === NO_SEX ? "" : next)
                }}
              >
                <SelectTrigger size="xl" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem id={NO_SEX}>Tidak dinyatakan</SelectItem>
                  {SEX_OPTIONS.map((option) => (
                    <SelectItem key={option.id} id={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </ResponsiveDialog>
      ) : null}

      {editTarget ? (
        <PersonEditDialog
          circleId={circleId}
          person={editTarget}
          onOpenChange={(open) => {
            if (!open) {
              setEditTarget(null)
            }
          }}
          onSaved={() => {
            void persons.reload()
          }}
        />
      ) : null}

      {accessTarget ? (
        <PersonAccessDialog
          circleId={circleId}
          person={accessTarget}
          members={members}
          onOpenChange={(open) => {
            if (!open) {
              setAccessTarget(null)
            }
          }}
        />
      ) : null}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
        title="Padam orang ini?"
        description={`${deleteTarget?.fullName ?? "Orang"} tidak lagi muncul dalam senarai. Rekod modul lain yang merujuknya kekal.`}
        confirmLabel="Padam"
        variant="destructive"
        icon={<IconTrash />}
        onConfirm={() => {
          const target = deleteTarget
          setDeleteTarget(null)
          if (target) {
            void run(
              getCircleRepository().deletePerson(circleId, target.id),
              "Orang dipadam."
            )
          }
        }}
      />
    </>
  )
}
