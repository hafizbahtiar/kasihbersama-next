"use client"

import { useState } from "react"
import { IconShield, IconTrash } from "@tabler/icons-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { createDataTableColumnHelper, DataTable } from "@/components/data-table"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { TableActionButton, TableActions } from "@/components/table-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getCircleRepository } from "@/lib/composition/circle-repository"
import type { CircleRole } from "@/lib/domain/circle"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"
import type { ApiError } from "@/lib/infrastructure/api/errors"

type Draft = {
  key: string
  name: string
  description: string
  rank: string
  permKeys: string[]
}

const EMPTY: Draft = {
  key: "",
  name: "",
  description: "",
  rank: "30",
  permKeys: [],
}

/**
 * Custom roles (docs/02 §5.2). The form only offers what the server would
 * accept - rank up to the caller's own, permissions the caller holds - so a
 * refusal means the rules changed underneath, not that the form lied.
 */
export function RolesSection({
  circleId,
  roles,
  isLoading,
  error,
  reload,
  canManage,
  actorRank,
  permissions,
}: {
  circleId: string
  roles: CircleRole[]
  isLoading: boolean
  error: ApiError | null
  reload: () => Promise<void>
  canManage: boolean
  actorRank: number
  permissions: string[]
}) {
  const [editing, setEditing] = useState<CircleRole | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [deleteTarget, setDeleteTarget] = useState<CircleRole | null>(null)
  const [busy, setBusy] = useState(false)
  const repo = getCircleRepository()

  const run = async (action: Promise<unknown>, done: string) => {
    setBusy(true)
    try {
      await action
      toast.success(done)
      await reload()
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

  const open = (role: CircleRole | null) => {
    setEditing(role)
    setDraft(
      role
        ? {
            key: role.key,
            name: role.name,
            description: role.description ?? "",
            rank: String(role.rank),
            permKeys: role.permKeys,
          }
        : EMPTY
    )
    setIsOpen(true)
  }

  const rank = Number(draft.rank)
  const rankValid = Number.isInteger(rank) && rank >= 0 && rank <= actorRank
  const canSave =
    !busy &&
    draft.name.trim().length > 0 &&
    rankValid &&
    (editing !== null || /^[a-z][a-z0-9_]{1,39}$/.test(draft.key))
  // Kunci yang role ini SUDAH ada kekal kelihatan supaya boleh dinyahtanda.
  const choices = [...new Set([...permissions, ...draft.permKeys])].sort()

  const save = async () => {
    const body = {
      name: draft.name.trim(),
      description: draft.description.trim() || undefined,
      rank,
      permKeys: draft.permKeys,
    }
    const ok = await run(
      editing
        ? repo.updateRole(circleId, editing.id, body)
        : repo.createRole(circleId, { ...body, key: draft.key }),
      editing ? "Peranan dikemas kini." : "Peranan dicipta."
    )
    if (ok) {
      setIsOpen(false)
    }
  }

  const helper = createDataTableColumnHelper<CircleRole>()
  const columns = helper.columns([
    helper.accessor("name", {
      header: "Nama",
      cell: ({ row }) => (
        <div className="min-w-0 space-y-0.5">
          <p className="font-medium">{row.original.name}</p>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {row.original.key}
          </p>
        </div>
      ),
    }),
    helper.accessor((row) => (row.isSystem ? "system" : "custom"), {
      id: "kind",
      header: "Jenis",
      filterFn: "equalsString",
      cell: ({ row }) => (
        <Badge variant={row.original.isSystem ? "secondary" : "outline"}>
          {row.original.isSystem ? "Sistem" : "Custom"}
        </Badge>
      ),
    }),
    helper.accessor("rank", { header: "Pangkat" }),
    helper.accessor((row) => row.permKeys.length, {
      id: "perms",
      header: "Kebenaran",
    }),
    helper.display({
      id: "action",
      header: () => <span className="flex justify-end">Tindakan</span>,
      enableSorting: false,
      cell: ({ row }) => {
        // Role sistem terkunci; role di atas pangkat sendiri ditolak pelayan.
        if (
          !canManage ||
          row.original.isSystem ||
          row.original.rank > actorRank
        ) {
          return null
        }
        return (
          <TableActions>
            <TableActionButton
              isDisabled={busy}
              onPress={() => open(row.original)}
            >
              Sunting
            </TableActionButton>
            <TableActionButton
              tone="danger"
              aria-label={`Padam ${row.original.name}`}
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
    <>
      <DataTable
        columns={columns}
        data={roles}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        errorMessage={error ? messageForApiError(error) : undefined}
        onRetry={() => void reload()}
        searchable
        searchPlaceholder="Cari peranan..."
        addLabel="Cipta peranan"
        onAdd={canManage ? () => open(null) : undefined}
        toolbarStart={
          <div className="space-y-1">
            <h2 className="font-heading text-lg tracking-tight">Peranan</h2>
            <p className="text-sm text-muted-foreground">
              Peranan sistem, dan peranan custom yang circle ini takrifkan.
            </p>
          </div>
        }
        emptyIcon={<IconShield />}
        emptyTitle="Tiada peranan"
        emptyDescription="Peranan sistem sepatutnya sentiasa ada - cuba muat semula."
      />

      <ResponsiveDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        title={editing ? "Sunting peranan" : "Cipta peranan"}
        description="Pangkat dan kebenaran tidak boleh melebihi peranan anda sendiri."
        footer={
          <>
            <Button variant="outline" onPress={() => setIsOpen(false)}>
              Batal
            </Button>
            <Button isDisabled={!canSave} onPress={() => void save()}>
              {editing ? "Simpan" : "Cipta"}
            </Button>
          </>
        }
      >
        {editing ? null : (
          <Field>
            <FieldLabel htmlFor="role-key">Kunci</FieldLabel>
            <Input
              id="role-key"
              value={draft.key}
              placeholder="penjaga_malam"
              onChange={(e) =>
                setDraft({ ...draft, key: e.target.value.toLowerCase() })
              }
            />
            <FieldDescription>
              Huruf kecil, nombor dan _. Tidak boleh diubah selepas dicipta.
            </FieldDescription>
          </Field>
        )}
        <Field>
          <FieldLabel htmlFor="role-name">Nama</FieldLabel>
          <Input
            id="role-name"
            value={draft.name}
            maxLength={80}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="role-description">Keterangan</FieldLabel>
          <Input
            id="role-description"
            value={draft.description}
            onChange={(e) =>
              setDraft({ ...draft, description: e.target.value })
            }
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="role-rank">Pangkat</FieldLabel>
          <Input
            id="role-rank"
            type="number"
            min={0}
            max={actorRank}
            value={draft.rank}
            aria-invalid={!rankValid}
            onChange={(e) => setDraft({ ...draft, rank: e.target.value })}
          />
          {/* 60 = rbac.RestrictedReadRank di backend: pangkat menentukan polisi
              field restricted, jadi pengguna mesti tahu apa yang ia buka. */}
          <FieldDescription>
            0 hingga {actorRank}. Ahli hanya boleh memberi peranan yang
            pangkatnya tidak melebihi pangkat sendiri. Pangkat 60 ke atas boleh
            membaca maklumat sulit (tarikh lahir, nota peribadi, isi catatan
            penjagaan); di bawahnya disamarkan.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel>Kebenaran</FieldLabel>
          <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-3">
            {choices.map((key) => (
              <Field
                key={key}
                orientation="horizontal"
                className="items-center"
              >
                <Checkbox
                  id={`perm-${key}`}
                  isSelected={draft.permKeys.includes(key)}
                  onChange={(selected) =>
                    setDraft({
                      ...draft,
                      permKeys: selected
                        ? [...draft.permKeys, key]
                        : draft.permKeys.filter((k) => k !== key),
                    })
                  }
                />
                <FieldLabel
                  htmlFor={`perm-${key}`}
                  className="font-mono text-xs font-normal"
                >
                  {key}
                </FieldLabel>
              </Field>
            ))}
          </div>
        </Field>
      </ResponsiveDialog>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setDeleteTarget(null)
          }
        }}
        title="Padam peranan?"
        description={`${deleteTarget?.name ?? "Peranan"} dipadam. Pindahkan ahli yang memegangnya dahulu.`}
        confirmLabel="Padam"
        variant="destructive"
        icon={<IconTrash />}
        onConfirm={() => {
          const target = deleteTarget
          setDeleteTarget(null)
          if (target) {
            void run(repo.deleteRole(circleId, target.id), "Peranan dipadam.")
          }
        }}
      />
    </>
  )
}
