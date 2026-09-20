"use client"

import { useCallback, useState } from "react"
import {
  IconCrown,
  IconDoorExit,
  IconMailForward,
  IconMailOff,
  IconTrash,
  IconUser,
} from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { CircleSettingsSection } from "@/components/circles/circle-settings-section"
import { PersonsSection } from "@/components/circles/persons-section"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { StatusChip } from "@/components/status-chip"
import { createDataTableColumnHelper, DataTable } from "@/components/data-table"
import { usePlatform } from "@/components/platform/platform-provider"
import { TableActionButton, TableActions } from "@/components/table-actions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCircleInvitations } from "@/hooks/use-circle-invitations"
import { useCircleMembers } from "@/hooks/use-circle-members"
import { useDisplayFormat } from "@/lib/application/display-preferences"
import { getCircleRepository } from "@/lib/composition/circle-repository"
import {
  ASSIGNABLE_ROLES,
  roleLabel,
  type CircleInvitation,
  type CircleMember,
} from "@/lib/domain/circle"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"

/** Permission keys this screen hides behind (docs/02 §4). */
const PERM_INVITE = "circle.invitation.create"
const PERM_READ_INVITE = "circle.invitation.read"
const PERM_MANAGE_MEMBER = "circle.member.manage"
const PERM_READ_PERSON = "core.person.read"
const PERM_CREATE_PERSON = "core.person.create"
const PERM_UPDATE_PERSON = "core.person.update"
const PERM_DELETE_PERSON = "core.person.delete"
const PERM_SHARE_PERSON = "core.person.share"
const PERM_UPDATE_CIRCLE = "circle.circle.update"

export function CircleDetail({ circleId }: { circleId: string }) {
  const router = useRouter()
  const { circles, activeCircle, can, refresh } = usePlatform()
  const members = useCircleMembers(circleId)
  const { date } = useDisplayFormat()

  const circle = circles.find((c) => c.id === circleId) ?? null
  const [email, setEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<string>("member")
  const [busy, setBusy] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<CircleMember | null>(null)
  const [transferTarget, setTransferTarget] = useState<CircleMember | null>(
    null
  )
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [isInviteOpen, setIsInviteOpen] = useState(false)

  // Permissions are resolved for the ACTIVE circle only, so this screen can
  // only trust them when the circle it shows IS the active one. On any other
  // circle the writes stay hidden and the server remains the authority.
  const isActive = activeCircle?.id === circleId
  const canInvite = isActive && can(PERM_INVITE)
  const canReadInvites = isActive && can(PERM_READ_INVITE)
  const canManage = isActive && can(PERM_MANAGE_MEMBER)
  const canReadPersons = isActive && can(PERM_READ_PERSON)
  const canCreatePerson = isActive && can(PERM_CREATE_PERSON)
  const canUpdatePerson = isActive && can(PERM_UPDATE_PERSON)
  const canDeletePerson = isActive && can(PERM_DELETE_PERSON)
  const canSharePerson = isActive && can(PERM_SHARE_PERSON)
  const canUpdateCircle = isActive && can(PERM_UPDATE_CIRCLE)
  const isOwner = circle?.roleKey === "owner"
  const invitations = useCircleInvitations(circleId, canReadInvites)

  // useCallback kerana ia dirujuk dalam sel jadual: fungsi baharu setiap render
  // bermakna lajur dibina semula setiap render juga.
  const run = useCallback(
    async (action: Promise<unknown>, done: string, reload = true) => {
      setBusy(true)
      try {
        await action
        toast.success(done)
        if (reload) {
          await members.reload()
        }
      } catch (cause) {
        toast.error(
          isApiError(cause) ? messageForApiError(cause) : "Tindakan gagal."
        )
      } finally {
        setBusy(false)
      }
    },
    [members]
  )

  const repo = getCircleRepository()

  // Tanpa useMemo: React Compiler yang memoize modul ini, dan senarai kebergantungan
  // tulis tangan di sini hanya berkemungkinan menyimpang daripada yang disimpulkannya.
  const memberHelper = createDataTableColumnHelper<CircleMember>()
  const memberColumns = memberHelper.columns([
    memberHelper.accessor("displayName", {
      header: "Nama",
      cell: ({ row }) => (
        <div className="min-w-0 space-y-0.5">
          <p className="font-medium">{row.original.displayName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {row.original.email}
          </p>
        </div>
      ),
    }),
    memberHelper.accessor((row) => roleLabel(row.roleKey), {
      id: "role",
      header: "Peranan",
      cell: ({ row }) =>
        canManage && row.original.roleKey !== "owner" ? (
          <Select
            aria-label={`Peranan ${row.original.displayName}`}
            value={row.original.roleKey}
            isDisabled={busy}
            onChange={(key) => {
              const roleKey = String(key ?? "")
              if (!roleKey || roleKey === row.original.roleKey) {
                return
              }
              void run(
                repo.changeMemberRole(circleId, row.original.id, roleKey),
                "Peranan dikemas kini."
              )
            }}
          >
            <SelectTrigger size="sm" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSIGNABLE_ROLES.map((role) => (
                <SelectItem key={role} id={role}>
                  {roleLabel(role)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span>{roleLabel(row.original.roleKey)}</span>
        ),
    }),
    memberHelper.accessor("status", {
      header: "Status",
      filterFn: "equalsString",
      cell: ({ getValue }) =>
        getValue() === "suspended" ? (
          <StatusChip tone="critical" label="Digantung" />
        ) : (
          <StatusChip tone="positive" label="Aktif" />
        ),
    }),
    memberHelper.accessor("joinedAt", {
      header: "Sertai",
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{date(getValue())}</span>
      ),
    }),
    memberHelper.display({
      id: "action",
      header: () => <span className="flex justify-end">Tindakan</span>,
      enableSorting: false,
      cell: ({ row }) => {
        // Pemilik tiada tindakan: ia dipindahkan, tidak dibuang atau digantung.
        if (!canManage || row.original.roleKey === "owner") {
          return null
        }
        return (
          <TableActions>
            <TableActionButton
              isDisabled={busy}
              onPress={() => {
                void run(
                  repo.setMemberStatus(
                    circleId,
                    row.original.id,
                    row.original.status === "suspended" ? "active" : "suspended"
                  ),
                  row.original.status === "suspended"
                    ? "Ahli diaktifkan semula."
                    : "Ahli digantung."
                )
              }}
            >
              {row.original.status === "suspended" ? "Aktifkan" : "Gantung"}
            </TableActionButton>
            {isOwner ? (
              <TableActionButton
                aria-label={`Serah milik kepada ${row.original.displayName}`}
                isDisabled={busy}
                onPress={() => setTransferTarget(row.original)}
              >
                <IconCrown />
                Serah milik
              </TableActionButton>
            ) : null}
            <TableActionButton
              aria-label={`Buang ${row.original.displayName}`}
              isDisabled={busy}
              onPress={() => setRemoveTarget(row.original)}
            >
              <IconTrash />
              Buang
            </TableActionButton>
          </TableActions>
        )
      },
    }),
  ])

  const invitationHelper = createDataTableColumnHelper<CircleInvitation>()
  const invitationColumns = invitationHelper.columns([
    invitationHelper.accessor("email", { header: "E-mel" }),
    invitationHelper.accessor((row) => roleLabel(row.roleKey), {
      id: "role",
      header: "Peranan",
    }),
    invitationHelper.accessor("status", {
      header: "Status",
      filterFn: "equalsString",
      // Senarai ini hanya membawa jemputan yang menunggu, jadi satu-satunya nada
      // yang betul ialah "menunggu seseorang".
      cell: () => <StatusChip tone="attention" label="Menunggu" />,
    }),
    invitationHelper.accessor("expiresAt", {
      header: "Tamat",
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{date(getValue())}</span>
      ),
    }),
    invitationHelper.display({
      id: "action",
      header: () => <span className="flex justify-end">Tindakan</span>,
      enableSorting: false,
      cell: ({ row }) =>
        canInvite ? (
          <TableActions>
            <TableActionButton
              aria-label={`Batalkan jemputan ${row.original.email}`}
              isDisabled={busy}
              onPress={() => {
                void run(
                  repo
                    .revokeInvitation(circleId, row.original.id)
                    .then(() => invitations.reload()),
                  "Jemputan dibatalkan.",
                  false
                )
              }}
            >
              <IconMailOff />
              Batalkan
            </TableActionButton>
          </TableActions>
        ) : null,
    }),
  ])

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl tracking-tight">
          {circle?.name ?? "Circle"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {circle
            ? `Peranan anda: ${roleLabel(circle.roleKey)}`
            : "Circle ini tiada dalam senarai keahlian anda."}
        </p>
      </div>

      {circle && !isActive ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          Circle ini bukan circle aktif anda, jadi tindakan pengurusan
          disembunyikan. Jadikan ia aktif dari halaman Circle dahulu.
        </p>
      ) : null}

      <DataTable
        columns={memberColumns}
        data={members.data}
        getRowId={(row) => row.id}
        isLoading={members.isLoading}
        errorMessage={
          members.error ? messageForApiError(members.error) : undefined
        }
        onRetry={() => {
          void members.reload()
        }}
        searchable
        searchPlaceholder="Cari ahli..."
        pageSize={10}
        addLabel="Jemput ahli"
        onAdd={canInvite ? () => setIsInviteOpen(true) : undefined}
        toolbarStart={
          <div className="space-y-1">
            <h2 className="font-heading text-lg tracking-tight">Ahli</h2>
            <p className="text-sm text-muted-foreground">
              Siapa dalam circle ini dan apa peranan mereka.
            </p>
          </div>
        }
        emptyIcon={<IconUser />}
        emptyTitle="Tiada ahli aktif"
        emptyDescription="Jemput seseorang dengan alamat e-mel mereka."
      />

      <ResponsiveDialog
        isOpen={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        title="Jemput ahli"
        description="Pautan jemputan dihantar ke e-mel itu; ia tidak pernah dipaparkan di sini."
        footer={
          <>
            <Button variant="outline" onPress={() => setIsInviteOpen(false)}>
              Batal
            </Button>
            <Button
              isDisabled={busy || email.trim().length === 0}
              onPress={() => {
                void run(
                  repo
                    .invite(circleId, {
                      email: email.trim(),
                      roleKey: inviteRole,
                    })
                    .then(() => {
                      setEmail("")
                      setIsInviteOpen(false)
                    })
                    .then(() => invitations.reload()),
                  "Jemputan dihantar.",
                  false
                )
              }}
            >
              <IconMailForward />
              Hantar jemputan
            </Button>
          </>
        }
      >
        <Field>
          <FieldLabel htmlFor="invite-email">E-mel</FieldLabel>
          <Input
            id="invite-email"
            type="email"
            value={email}
            placeholder="nama@contoh.com"
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>Peranan</FieldLabel>
          <Select
            className="w-full"
            aria-label="Peranan jemputan"
            value={inviteRole}
            onChange={(key) => setInviteRole(String(key ?? "member"))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSIGNABLE_ROLES.map((role) => (
                <SelectItem key={role} id={role}>
                  {roleLabel(role)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </ResponsiveDialog>

      {canReadInvites ? (
        <DataTable
          columns={invitationColumns}
          data={invitations.data}
          getRowId={(row) => row.id}
          isLoading={invitations.isLoading}
          errorMessage={
            invitations.error
              ? messageForApiError(invitations.error)
              : undefined
          }
          onRetry={() => {
            void invitations.reload()
          }}
          pageSize={5}
          addLabel="Jemput ahli"
          onAdd={canInvite ? () => setIsInviteOpen(true) : undefined}
          toolbarStart={
            <div className="space-y-1">
              <h2 className="font-heading text-lg tracking-tight">
                Jemputan menunggu
              </h2>
              <p className="text-sm text-muted-foreground">
                Jemputan yang sudah diterima muncul sebagai ahli, bukan di sini.
              </p>
            </div>
          }
          emptyIcon={<IconMailForward />}
          emptyTitle="Tiada jemputan menunggu"
          emptyDescription="Setiap jemputan yang dihantar akan disenaraikan di sini sehingga diterima."
        />
      ) : null}

      <PersonsSection
        circleId={circleId}
        members={members.data}
        canRead={canReadPersons}
        canCreate={canCreatePerson}
        canUpdate={canUpdatePerson}
        canDelete={canDeletePerson}
        canShare={canSharePerson}
      />

      <CircleSettingsSection
        circleId={circleId}
        canUpdate={canUpdateCircle}
        onSaved={() => {
          // Nama circle muncul dalam navigasi dan header, dan kedua-duanya
          // membaca bootstrap - jadi ia dibaca semula, bukan ditampal tempatan.
          void refresh()
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Keluar circle</CardTitle>
          <CardDescription>
            {isOwner
              ? "Pemilik mesti menyerahkan pemilikan sebelum boleh keluar."
              : "Anda hilang akses kepada semua rekod circle ini."}
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-end">
          <Button
            variant="destructive"
            isDisabled={busy || !circle}
            onPress={() => setLeaveOpen(true)}
          >
            <IconDoorExit />
            Keluar
          </Button>
        </CardFooter>
      </Card>

      <ConfirmDialog
        isOpen={Boolean(removeTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRemoveTarget(null)
          }
        }}
        title="Buang ahli?"
        description={`${removeTarget?.displayName ?? "Ahli"} hilang akses kepada circle ini serta-merta.`}
        confirmLabel="Buang"
        variant="destructive"
        onConfirm={() => {
          const target = removeTarget
          setRemoveTarget(null)
          if (target) {
            void run(repo.removeMember(circleId, target.id), "Ahli dibuang.")
          }
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(transferTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setTransferTarget(null)
          }
        }}
        title="Serahkan pemilikan?"
        description={`${transferTarget?.displayName ?? "Ahli"} menjadi pemilik, dan anda menjadi pentadbir. Tindakan ini tidak boleh dibuat sendiri semula.`}
        confirmLabel="Serahkan"
        variant="destructive"
        icon={<IconCrown />}
        onConfirm={() => {
          const target = transferTarget
          setTransferTarget(null)
          if (target) {
            void run(
              repo
                .transferOwnership(circleId, target.id)
                // Peranan sendiri berubah, dan peranan itu datang daripada
                // bootstrap - bukan daripada senarai ahli.
                .then(() => refresh()),
              "Pemilikan diserahkan."
            )
          }
        }}
      />

      <ConfirmDialog
        isOpen={leaveOpen}
        onOpenChange={setLeaveOpen}
        title="Keluar dari circle?"
        description="Anda perlu dijemput semula untuk masuk balik."
        confirmLabel="Keluar"
        variant="destructive"
        icon={<IconDoorExit />}
        onConfirm={() => {
          setLeaveOpen(false)
          void run(
            repo
              .leaveCircle(circleId)
              .then(() => refresh())
              .then(() => router.push("/circles")),
            "Anda telah keluar.",
            false
          )
        }}
      />
    </div>
  )
}
