"use client"

import { useState } from "react"
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
import { usePlatform } from "@/components/platform/platform-provider"
import { AsyncStateBanner } from "@/components/shared/async-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useCircleInvitations } from "@/hooks/use-circle-invitations"
import { useCircleMembers } from "@/hooks/use-circle-members"
import { useDisplayFormat } from "@/lib/application/display-preferences"
import { getCircleRepository } from "@/lib/composition/circle-repository"
import {
  ASSIGNABLE_ROLES,
  roleLabel,
  type CircleMember,
} from "@/lib/domain/circle"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"

/** Permission keys this screen hides behind (docs/02 §4). */
const PERM_INVITE = "circle.invitation.create"
const PERM_READ_INVITE = "circle.invitation.read"
const PERM_MANAGE_MEMBER = "circle.member.manage"

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
  const [transferTarget, setTransferTarget] = useState<CircleMember | null>(null)
  const [leaveOpen, setLeaveOpen] = useState(false)

  // Permissions are resolved for the ACTIVE circle only, so this screen can
  // only trust them when the circle it shows IS the active one. On any other
  // circle the writes stay hidden and the server remains the authority.
  const isActive = activeCircle?.id === circleId
  const canInvite = isActive && can(PERM_INVITE)
  const canReadInvites = isActive && can(PERM_READ_INVITE)
  const canManage = isActive && can(PERM_MANAGE_MEMBER)
  const isOwner = circle?.roleKey === "owner"
  const invitations = useCircleInvitations(circleId, canReadInvites)

  async function run(action: Promise<unknown>, done: string, reload = true) {
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
  }

  const repo = getCircleRepository()

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

      <Card>
        <CardHeader>
          <CardTitle>Ahli</CardTitle>
          <CardDescription>
            Siapa dalam circle ini dan apa peranan mereka.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AsyncStateBanner
            error={members.error}
            onRetry={() => {
              void members.reload()
            }}
            label="Gagal memuatkan ahli."
          />

          {members.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : members.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tiada ahli aktif.</p>
          ) : (
            <ItemGroup className="gap-3">
              {members.data.map((member) => (
                <Item key={member.id} variant="muted" className="items-start">
                  <ItemMedia variant="icon">
                    <IconUser />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className="flex flex-wrap items-center gap-2">
                      {member.displayName}
                      <Badge variant="outline">
                        {roleLabel(member.roleKey)}
                      </Badge>
                      {member.status === "suspended" ? (
                        <Badge variant="destructive">Digantung</Badge>
                      ) : null}
                    </ItemTitle>
                    <ItemDescription>
                      {member.email} · sertai {date(member.joinedAt)}
                    </ItemDescription>
                  </ItemContent>
                  {canManage && member.roleKey !== "owner" ? (
                    <ItemActions className="flex-col items-end gap-2 sm:flex-row sm:items-center">
                      <Select
                        aria-label={`Peranan ${member.displayName}`}
                        value={member.roleKey}
                        isDisabled={busy}
                        onChange={(key) => {
                          const roleKey = String(key ?? "")
                          if (!roleKey || roleKey === member.roleKey) {
                            return
                          }
                          void run(
                            repo.changeMemberRole(circleId, member.id, roleKey),
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
                      <Button
                        variant="outline"
                        size="sm"
                        isDisabled={busy}
                        onPress={() => {
                          void run(
                            repo.setMemberStatus(
                              circleId,
                              member.id,
                              member.status === "suspended"
                                ? "active"
                                : "suspended"
                            ),
                            member.status === "suspended"
                              ? "Ahli diaktifkan semula."
                              : "Ahli digantung."
                          )
                        }}
                      >
                        {member.status === "suspended" ? "Aktifkan" : "Gantung"}
                      </Button>
                      {isOwner ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          isDisabled={busy}
                          onPress={() => setTransferTarget(member)}
                        >
                          <IconCrown />
                          Serah milik
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="sm"
                        isDisabled={busy}
                        onPress={() => setRemoveTarget(member)}
                      >
                        <IconTrash />
                        Buang
                      </Button>
                    </ItemActions>
                  ) : null}
                </Item>
              ))}
            </ItemGroup>
          )}
        </CardContent>
      </Card>

      {canInvite ? (
        <Card>
          <CardHeader>
            <CardTitle>Jemput ahli</CardTitle>
            <CardDescription>
              Pautan jemputan dihantar ke e-mel itu; ia tidak pernah dipaparkan
              di sini.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
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
          </CardContent>
          <CardFooter className="justify-end">
            <Button
              isDisabled={busy || email.trim().length === 0}
              onPress={() => {
                void run(
                  repo
                    .invite(circleId, {
                      email: email.trim(),
                      roleKey: inviteRole,
                    })
                    .then(() => setEmail(""))
                    .then(() => invitations.reload()),
                  "Jemputan dihantar.",
                  false
                )
              }}
            >
              <IconMailForward />
              Hantar jemputan
            </Button>
          </CardFooter>
        </Card>
      ) : null}

      {canReadInvites ? (
        <Card>
          <CardHeader>
            <CardTitle>Jemputan menunggu</CardTitle>
            <CardDescription>
              Jemputan yang sudah diterima muncul sebagai ahli, bukan di sini.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AsyncStateBanner
              error={invitations.error}
              onRetry={() => {
                void invitations.reload()
              }}
              label="Gagal memuatkan jemputan."
            />
            {invitations.isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : invitations.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Tiada jemputan menunggu.
              </p>
            ) : (
              <ItemGroup className="gap-3">
                {invitations.data.map((invitation) => (
                  <Item key={invitation.id} variant="muted">
                    <ItemMedia variant="icon">
                      <IconMailForward />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{invitation.email}</ItemTitle>
                      <ItemDescription>
                        {roleLabel(invitation.roleKey)} · tamat{" "}
                        {date(invitation.expiresAt)}
                      </ItemDescription>
                    </ItemContent>
                    {canInvite ? (
                      <ItemActions>
                        <Button
                          variant="ghost"
                          size="sm"
                          isDisabled={busy}
                          onPress={() => {
                            void run(
                              getCircleRepository()
                                .revokeInvitation(circleId, invitation.id)
                                .then(() => invitations.reload()),
                              "Jemputan dibatalkan.",
                              false
                            )
                          }}
                        >
                          <IconMailOff />
                          Batalkan
                        </Button>
                      </ItemActions>
                    ) : null}
                  </Item>
                ))}
              </ItemGroup>
            )}
          </CardContent>
        </Card>
      ) : null}

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
