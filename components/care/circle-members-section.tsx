"use client"

import { useMemo, useState } from "react"
import { IconTrash, IconUsers } from "@tabler/icons-react"
import { toast } from "sonner"

import { AsyncStateBanner } from "@/components/care/async-state"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { createDataTableColumnHelper, DataTable } from "@/components/data-table"
import { TableActionButton, TableActions } from "@/components/table-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCircleMembers } from "@/hooks/use-circle-members"
import {
  CIRCLE_MEMBER_ROLE_LABELS,
  type CircleMember,
  type CircleMemberRole,
} from "@/lib/domain/care"
import { isApiError } from "@/lib/infrastructure/api/errors"

const ROLE_OPTIONS: CircleMemberRole[] = ["owner", "admin", "member"]

/**
 * Who belongs to a circle, and at what role.
 *
 * Circle roles are their own model: owner, admin and member govern the circle
 * itself and grant nothing on the care profiles linked into it. Someone added
 * here can rename or archive the circle, depending on role - they do not
 * thereby gain access to anyone's medical records, which come from the
 * separate profile permission set.
 */
export function CircleMembersSection({
  circleId,
  archived,
}: {
  circleId: string
  archived: boolean
}) {
  const { members, isLoading, error, reload, add, remove } =
    useCircleMembers(circleId)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<CircleMemberRole>("member")
  const [isAdding, setIsAdding] = useState(false)
  const [pendingRemoval, setPendingRemoval] = useState<CircleMember | null>(
    null
  )

  async function submitAdd() {
    const trimmed = email.trim()
    if (!trimmed || isAdding) {
      return
    }
    setIsAdding(true)
    try {
      await add(trimmed, role)
      setEmail("")
      toast.success("Ahli ditambah.")
    } catch (cause) {
      // The server's own message is shown rather than a generic one: it
      // distinguishes an address with no account from a role that was
      // refused, and the caller can act on the difference.
      toast.error(
        isApiError(cause) ? cause.message : "Gagal menambah ahli kumpulan."
      )
    } finally {
      setIsAdding(false)
    }
  }

  async function confirmRemoval() {
    const target = pendingRemoval
    if (!target) {
      return
    }
    try {
      await remove(target.userId)
      toast.success("Ahli dibuang.")
    } catch (cause) {
      // Removing the last owner is refused server-side (409): a circle with
      // nobody who can manage it is a dead end.
      toast.error(
        isApiError(cause) ? cause.message : "Gagal membuang ahli kumpulan."
      )
    }
  }

  const columns = useMemo(() => {
    const helper = createDataTableColumnHelper<CircleMember>()
    return helper.columns([
      helper.accessor("displayName", { header: "Nama" }),
      helper.accessor("email", { header: "E-mel" }),
      helper.accessor((row) => CIRCLE_MEMBER_ROLE_LABELS[row.role], {
        id: "role",
        header: "Peranan",
        cell: ({ getValue }) => <Badge variant="secondary">{getValue()}</Badge>,
      }),
      helper.display({
        id: "action",
        header: () => <span className="flex justify-end">Action</span>,
        enableSorting: false,
        cell: ({ row }) =>
          archived ? null : (
            <TableActions>
              <TableActionButton
                aria-label={`Buang ${row.original.displayName}`}
                onPress={() => setPendingRemoval(row.original)}
              >
                <IconTrash />
                Buang
              </TableActionButton>
            </TableActions>
          ),
      }),
    ])
  }, [archived])

  if (error) {
    return <AsyncStateBanner error={error} onRetry={() => void reload()} />
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={members}
        getRowId={(row) => row.userId}
        isLoading={isLoading}
        toolbarStart={
          <div className="space-y-1">
            <h2 className="font-heading text-lg tracking-tight">
              Ahli kumpulan
            </h2>
            <p className="text-sm text-muted-foreground">
              Peranan kumpulan berasingan daripada keizinan profil - ahli di
              sini tidak mendapat akses kepada rekod perubatan sesiapa.
            </p>
          </div>
        }
        toolbarActions={
          archived ? (
            <Badge variant="secondary">Kumpulan diarkib</Badge>
          ) : (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <Input
                type="email"
                className="h-8 w-full sm:w-56"
                placeholder="E-mel ahli"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <Select
                className="w-full sm:w-36"
                value={role}
                onChange={(key) => setRole(String(key ?? "member") as CircleMemberRole)}
              >
                <SelectTrigger className="h-8 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((item) => (
                    <SelectItem key={item} id={item}>
                      {CIRCLE_MEMBER_ROLE_LABELS[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                isDisabled={isAdding || !email.trim()}
                onPress={() => void submitAdd()}
              >
                Tambah
              </Button>
            </div>
          )
        }
        emptyIcon={<IconUsers />}
        emptyTitle="Belum ada ahli"
        emptyDescription="Tambah ahli dengan alamat e-mel akaun yang sudah wujud."
      />

      <ConfirmDialog
        isOpen={pendingRemoval !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingRemoval(null)
          }
        }}
        title="Buang ahli?"
        description={
          pendingRemoval
            ? `${pendingRemoval.displayName} tidak lagi menjadi ahli kumpulan ini.`
            : ""
        }
        confirmLabel="Buang"
        variant="destructive"
        onConfirm={() => void confirmRemoval()}
      />
    </>
  )
}
