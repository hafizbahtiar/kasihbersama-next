"use client"

import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import {
  IconAlertTriangle,
  IconArchive,
  IconInbox,
  IconPlus,
} from "@tabler/icons-react"

import { BackButton } from "@/components/back-button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { EmailVerifiedGate } from "@/components/auth/email-verified-gate"
import { ApiFieldGapNotice } from "@/components/care/api-field-gap-notice"
import { ProfileAuditTab } from "@/components/care/profile-audit-tab"
import { AsyncStateBanner } from "@/components/care/async-state"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useCareData } from "@/components/care/care-data-provider"
import { PageHeader } from "@/components/care/page-header"
import { PermissionGate } from "@/components/care/permission-gate"
import {
  ProfileStatusBadge,
  MemberStatusBadge,
} from "@/components/care/status-badges"
import { createDataTableColumnHelper, DataTable } from "@/components/data-table"
import { TableActionButton, TableActions } from "@/components/table-actions"
import { Badge } from "@/components/ui/badge"
import { Button, LinkButton } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePaginatedCareResource } from "@/hooks/use-paginated-care-resource"
import { buildTimeline, formatDateTime } from "@/lib/application/care-format"
import { isMockDataEnabled } from "@/lib/infrastructure/config"
import {
  buildClaimAcceptLink,
  buildInviteAcceptLink,
} from "@/lib/application/deep-links"
import {
  CARE_PERMISSIONS,
  CARE_ROLES,
  CLAIM_STATUS_LABELS,
  INVITE_STATUS_LABELS,
  PERMISSION_LABELS,
  ROLE_LABELS,
  TIMELINE_KIND_LABELS,
  type CareClaim,
  type CareInvite,
  type CareMember,
  type CarePermission,
  type CarePermissions,
  type CareRole,
  type TimelineItem,
} from "@/lib/domain/care"
import { getCareRepository } from "@/lib/composition/care-repository"
import { messageForApiError } from "@/lib/infrastructure/api/errors"

function fieldValue(event: unknown) {
  if (typeof event === "string") {
    return event
  }
  if (event && typeof event === "object" && "target" in event) {
    return String((event as { target: { value: string } }).target.value ?? "")
  }
  return ""
}

type DestructiveTableAction =
  | { kind: "removeMember"; userId: string; name: string }
  | { kind: "revokeInvite"; id: string; email: string }
  | { kind: "revokeClaim"; id: string; email: string }

function destructiveTableCopy(action: DestructiveTableAction) {
  switch (action.kind) {
    case "removeMember":
      return {
        title: `Keluarkan ${action.name}?`,
        description:
          "Ahli ini tidak lagi boleh mengakses profil jagaan. Tindakan ini boleh diundur dengan jemput semula.",
        confirmLabel: "Keluarkan",
      }
    case "revokeInvite":
      return {
        title: "Batalkan jemputan?",
        description: `Pautan jemputan untuk ${action.email} tidak lagi sah.`,
        confirmLabel: "Batalkan jemputan",
      }
    case "revokeClaim":
      return {
        title: "Batalkan tuntutan?",
        description: `Pautan tuntutan untuk ${action.email} tidak lagi sah.`,
        confirmLabel: "Batalkan tuntutan",
      }
  }
}

export function ProfileDetailPage({ profileId }: { profileId: string }) {
  const router = useRouter()
  const apiMode = !isMockDataEnabled()
  const {
    snapshot,
    updateProfile,
    archiveProfile,
    inviteMember,
    revokeInvite,
    createClaim,
    revokeClaim,
    updateMemberRole,
    removeMember,
    setSelectedProfileId,
    isRefreshing,
  } = useCareData()
  const profile = snapshot.profiles.find((item) => item.id === profileId)
  const circle = snapshot.circles.find((item) => item.id === profile?.circleId)
  const members = snapshot.members.filter(
    (item) => item.profileId === profileId
  )
  const invites = snapshot.invites.filter(
    (item) => item.profileId === profileId
  )
  const claims = snapshot.claims.filter((item) => item.profileId === profileId)

  const fetchTimeline = useMemo(
    () =>
      (activeProfileId: string, params: { page?: number; perPage?: number }) =>
        getCareRepository().listTimeline(activeProfileId, params),
    []
  )

  const timelinePaginated = usePaginatedCareResource<TimelineItem>({
    profileId,
    enabled: apiMode,
    fetcher: fetchTimeline,
    initialPerPage: 10,
  })

  const mockTimeline = useMemo(
    () => (profile ? buildTimeline(snapshot, profile.id) : []),
    [profile, snapshot]
  )
  const timeline = apiMode ? (timelinePaginated.data?.data ?? []) : mockTimeline
  const timelineLoading = apiMode ? timelinePaginated.isLoading : isRefreshing
  const timelineError =
    apiMode && timelinePaginated.error
      ? messageForApiError(timelinePaginated.error)
      : undefined

  const [archiveOpen, setArchiveOpen] = useState(false)
  const [destructiveAction, setDestructiveAction] =
    useState<DestructiveTableAction | null>(null)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<CareRole>("family_contributor")
  const [claimEmail, setClaimEmail] = useState("")
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)

  const permissionRows = useMemo(
    () =>
      CARE_PERMISSIONS.map((key) => ({
        id: key,
        label: PERMISSION_LABELS[key],
        granted: Boolean(profile?.permissions[key]),
      })),
    [profile]
  )

  const permissionColumns = useMemo(() => {
    const helper = createDataTableColumnHelper<{
      id: CarePermission
      label: string
      granted: boolean
    }>()
    return helper.columns([
      helper.accessor("label", { header: "Keizinan" }),
      helper.accessor("granted", {
        header: "Status",
        cell: ({ getValue }) =>
          getValue() ? (
            <Badge>Ada</Badge>
          ) : (
            <Badge variant="secondary">Tiada</Badge>
          ),
      }),
    ])
  }, [])

  const memberColumns = useMemo(() => {
    const helper = createDataTableColumnHelper<CareMember>()
    return helper.columns([
      helper.accessor("displayName", { header: "Nama" }),
      helper.accessor("email", { header: "E-mel" }),
      helper.accessor((row) => ROLE_LABELS[row.role], {
        id: "role",
        header: "Peranan",
      }),
      helper.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => <MemberStatusBadge value={getValue()} />,
      }),
      helper.display({
        id: "action",
        header: () => <span className="flex justify-end">Action</span>,
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <TableActions>
            <TableActionButton
              onPress={() => setEditingMemberId(row.original.id)}
            >
              Peranan
            </TableActionButton>
            {row.original.userId !== "user-me" ? (
              <TableActionButton
                variant="destructive"
                onPress={() =>
                  setDestructiveAction({
                    kind: "removeMember",
                    userId: row.original.userId,
                    name: row.original.displayName,
                  })
                }
              >
                Keluarkan
              </TableActionButton>
            ) : null}
          </TableActions>
        ),
      }),
    ])
  }, [removeMember])

  const inviteColumns = useMemo(() => {
    const helper = createDataTableColumnHelper<CareInvite>()
    return helper.columns([
      helper.accessor("email", { header: "E-mel" }),
      helper.accessor((row) => ROLE_LABELS[row.role], {
        id: "role",
        header: "Peranan",
      }),
      helper.accessor("status", {
        header: "Status",
        filterFn: "equalsString",
        enableColumnFilter: true,
        cell: ({ getValue }) => (
          <Badge variant={getValue() === "pending" ? "default" : "secondary"}>
            {INVITE_STATUS_LABELS[getValue()]}
          </Badge>
        ),
      }),
      helper.accessor("token", {
        header: "Token",
        cell: ({ getValue }) => (
          <span className="hidden max-w-[12rem] truncate md:inline">
            {getValue()}
          </span>
        ),
      }),
      helper.display({
        id: "action",
        header: () => <span className="flex justify-end">Action</span>,
        enableSorting: false,
        enableGlobalFilter: false,
        enableColumnFilter: false,
        cell: ({ row }) =>
          row.original.status === "pending" ? (
            <TableActions>
              <TableActionButton
                onPress={() =>
                  router.push(buildInviteAcceptLink(row.original.token))
                }
              >
                Terima
              </TableActionButton>
              <TableActionButton
                variant="destructive"
                onPress={() =>
                  setDestructiveAction({
                    kind: "revokeInvite",
                    id: row.original.id,
                    email: row.original.email,
                  })
                }
              >
                Batalkan
              </TableActionButton>
            </TableActions>
          ) : null,
      }),
    ])
  }, [revokeInvite, router])

  const claimColumns = useMemo(() => {
    const helper = createDataTableColumnHelper<CareClaim>()
    return helper.columns([
      helper.accessor("email", { header: "E-mel" }),
      helper.accessor("status", {
        header: "Status",
        filterFn: "equalsString",
        enableColumnFilter: true,
        cell: ({ getValue }) => (
          <Badge variant={getValue() === "pending" ? "default" : "secondary"}>
            {CLAIM_STATUS_LABELS[getValue()]}
          </Badge>
        ),
      }),
      helper.accessor("token", {
        header: "Token",
        cell: ({ getValue }) => (
          <span className="hidden max-w-[12rem] truncate md:inline">
            {getValue()}
          </span>
        ),
      }),
      helper.display({
        id: "action",
        header: () => <span className="flex justify-end">Action</span>,
        enableSorting: false,
        enableGlobalFilter: false,
        enableColumnFilter: false,
        cell: ({ row }) =>
          row.original.status === "pending" ? (
            <TableActions>
              <TableActionButton
                onPress={() =>
                  router.push(buildClaimAcceptLink(row.original.token))
                }
              >
                Terima
              </TableActionButton>
              <TableActionButton
                variant="destructive"
                onPress={() =>
                  setDestructiveAction({
                    kind: "revokeClaim",
                    id: row.original.id,
                    email: row.original.email,
                  })
                }
              >
                Batalkan
              </TableActionButton>
            </TableActions>
          ) : null,
      }),
    ])
  }, [revokeClaim, router])

  const timelineColumns = useMemo(() => {
    const helper = createDataTableColumnHelper<TimelineItem>()
    return helper.columns([
      helper.accessor("occurredAt", {
        header: "Masa",
        cell: ({ getValue }) => formatDateTime(getValue()),
      }),
      helper.accessor("kind", {
        header: "Jenis",
        filterFn: "equalsString",
        enableColumnFilter: true,
        cell: ({ getValue }) => TIMELINE_KIND_LABELS[getValue()],
      }),
      helper.accessor("title", { header: "Tajuk" }),
      helper.accessor("body", {
        header: "Butiran",
        cell: ({ getValue }) => (
          <span className="block max-w-xs truncate">{getValue()}</span>
        ),
      }),
      helper.accessor((row) => row.meta ?? "-", { id: "meta", header: "Meta" }),
    ])
  }, [])

  if (!profile) {
    return (
      <div className="flex flex-col gap-4">
        <BackButton href="/care-profiles" />
        <p className="text-sm text-muted-foreground">Profil tidak dijumpai.</p>
      </div>
    )
  }

  const editingMember = members.find((item) => item.id === editingMemberId)

  return (
    <div className="flex flex-col gap-4">
      <BackButton href="/care-profiles" />
      <PageHeader
        title={profile.displayName}
        description="Ubat, temujanji, log dan dokumen untuk orang ini."
        meta={
          <>
            <ProfileStatusBadge value={profile.status} />
            <span className="text-sm text-muted-foreground">
              {apiMode || !profile.relation
                ? ROLE_LABELS[profile.role]
                : `${profile.relation} · ${ROLE_LABELS[profile.role]}`}
            </span>
          </>
        }
        actions={
          <>
            <LinkButton
              href={`/care-profiles/${profile.id}/edit`}
              variant="outline"
            >
              Sunting
            </LinkButton>
            {profile.status === "active" ? (
              <Button
                variant="destructive"
                onPress={() => setArchiveOpen(true)}
              >
                <IconArchive />
                Arkib
              </Button>
            ) : (
              <Button
                variant="outline"
                onPress={() => {
                  void updateProfile(profile.id, { status: "active" })
                }}
              >
                Aktifkan
              </Button>
            )}
          </>
        }
      />

      <Tabs defaultSelectedKey="overview" className="gap-5">
        <div className="overflow-x-auto pb-1">
          <TabsList>
            <TabsTrigger id="overview">Ringkasan</TabsTrigger>
            <TabsTrigger id="access">Ahli & akses</TabsTrigger>
            <TabsTrigger id="claims">Tuntutan</TabsTrigger>
            <TabsTrigger id="timeline">Timeline</TabsTrigger>
            <TabsTrigger id="history">Sejarah</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent id="overview" className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Maklumat profil</CardTitle>
              <CardDescription>
                Status, kumpulan dan keizinan anda pada profil ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Detail label="Tarikh lahir" value={profile.dateOfBirth || "-"} />
              {apiMode ? (
                <div className="sm:col-span-2">
                  <ApiFieldGapNotice>
                    Hubungan dan nota belum disediakan oleh API profil jagaan.
                  </ApiFieldGapNotice>
                </div>
              ) : (
                <>
                  <Detail label="Nota" value={profile.notes || "-"} />
                </>
              )}
              <Detail label="Kumpulan" value={circle?.name ?? "Tiada"} />
              <Detail label="Peranan anda" value={ROLE_LABELS[profile.role]} />
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <LinkButton
                href="/circles"
                variant="outline"
                onPress={() => setSelectedProfileId(profile.id)}
              >
                Urus kumpulan
              </LinkButton>
              <LinkButton
                href="/immunisations"
                variant="outline"
                onPress={() => setSelectedProfileId(profile.id)}
              >
                Buku imunisasi
              </LinkButton>
              <Button
                onPress={() => {
                  setSelectedProfileId(profile.id)
                  router.push("/medications")
                }}
              >
                Buka rekod jagaan
              </Button>
            </CardFooter>
          </Card>

          <DataTable
            columns={permissionColumns}
            data={permissionRows}
            getRowId={(row) => row.id}
            isLoading={isRefreshing}
            paginate={false}
            searchable
            searchPlaceholder="Cari keizinan..."
            toolbarStart={
              <div className="space-y-1">
                <h2 className="font-heading text-lg tracking-tight">
                  Keizinan anda
                </h2>
                <p className="text-sm text-muted-foreground">
                  Dipadankan dengan role backend. Tindakan akan disembunyikan
                  kemudian apabila API disambung.
                </p>
              </div>
            }
          />
        </TabsContent>

        <TabsContent id="access" className="flex flex-col gap-6">
          <Section
            title="Ahli"
            description="Siapa boleh lihat dan bantu profil ini."
          >
            <DataTable
              columns={memberColumns}
              data={members}
              getRowId={(row) => row.id}
              isLoading={isRefreshing}
              searchable
              searchPlaceholder="Cari ahli..."
              emptyIcon={<IconInbox />}
              emptyTitle="Tiada ahli"
              emptyDescription="Jemput ahli untuk berkongsi profil ini."
            />
            {editingMember ? (
              <PermissionEditor
                name={editingMember.displayName}
                role={editingMember.role}
                permissions={editingMember.permissions}
                onCancel={() => setEditingMemberId(null)}
                onSave={(role, permissions) => {
                  void updateMemberRole(
                    profileId,
                    editingMember.userId,
                    role,
                    permissions
                  ).then(() => setEditingMemberId(null))
                }}
              />
            ) : null}
          </Section>

          <Separator />

          <Section
            title="Jemputan"
            description="Beri akses melalui e-mel. Boleh tarik balik bila-bila."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Jemput ahli</CardTitle>
                  <CardDescription>
                    E-mel jemputan. Token demo dipaparkan supaya aliran terima
                    boleh diuji.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <Field>
                      <FieldLabel>E-mel</FieldLabel>
                      <Input
                        size="xl"
                        className="bg-background"
                        value={inviteEmail}
                        onChange={(event) => setInviteEmail(fieldValue(event))}
                        placeholder="nama@contoh.com"
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Peranan</FieldLabel>
                      <Select
                        className="w-full"
                        value={inviteRole}
                        onChange={(key) =>
                          setInviteRole(String(key) as CareRole)
                        }
                      >
                        <SelectTrigger size="xl" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CARE_ROLES.map((role) => (
                            <SelectItem key={role} id={role}>
                              {ROLE_LABELS[role]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </FieldGroup>
                </CardContent>
                <CardFooter className="justify-end">
                  <PermissionGate permission="can_invite_members">
                    <EmailVerifiedGate>
                      <Button
                        onPress={() => {
                          if (!inviteEmail.trim()) {
                            return
                          }
                          void inviteMember(
                            profile.id,
                            inviteEmail.trim(),
                            inviteRole
                          ).then(() => setInviteEmail(""))
                        }}
                      >
                        <IconPlus />
                        Hantar jemputan
                      </Button>
                    </EmailVerifiedGate>
                  </PermissionGate>
                </CardFooter>
              </Card>
            </div>
            <DataTable
              columns={inviteColumns}
              data={invites}
              getRowId={(row) => row.id}
              isLoading={isRefreshing}
              searchable
              searchPlaceholder="Cari jemputan..."
              filter={{
                columnId: "status",
                label: "Status",
                options: Object.entries(INVITE_STATUS_LABELS).map(
                  ([value, label]) => ({ value, label })
                ),
              }}
              emptyIcon={<IconInbox />}
              emptyTitle="Tiada jemputan"
              emptyDescription="Hantar jemputan untuk menambah ahli."
            />
          </Section>
        </TabsContent>

        <TabsContent id="claims" className="flex flex-col gap-4">
          <PermissionGate
            feature="profile_claim"
            permission="can_invite_members"
          >
            <Section
              title="Tuntutan profil"
              description="Serahkan profil ini kepada orang yang dijaga."
            >
              <Alert variant="destructive">
                <IconAlertTriangle />
                <AlertTitle>Tidak boleh dibatalkan</AlertTitle>
                <AlertDescription>
                  Bukan jemputan. Mereka jadi pemilik profil ini. Anda tidak
                  boleh tukar atau keluarkan mereka selepas itu.
                </AlertDescription>
              </Alert>
              <div className="grid gap-4 lg:grid-cols-2">
                <PermissionGate
                  feature="profile_claim"
                  permission="can_invite_members"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Tuntutan profil</CardTitle>
                      <CardDescription>
                        Semak e-mel dua kali sebelum hantar.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Field>
                        <FieldLabel>E-mel subjek</FieldLabel>
                        <Input
                          size="xl"
                          className="bg-background"
                          value={claimEmail}
                          onChange={(event) => setClaimEmail(fieldValue(event))}
                          placeholder="subjek@contoh.com"
                        />
                      </Field>
                    </CardContent>
                    <CardFooter className="justify-end">
                      <EmailVerifiedGate>
                        <Button
                          onPress={() => {
                            if (!claimEmail.trim()) {
                              return
                            }
                            void createClaim(
                              profile.id,
                              claimEmail.trim()
                            ).then(() => setClaimEmail(""))
                          }}
                        >
                          Cipta tuntutan
                        </Button>
                      </EmailVerifiedGate>
                    </CardFooter>
                  </Card>
                </PermissionGate>
              </div>
              <DataTable
                columns={claimColumns}
                data={claims}
                getRowId={(row) => row.id}
                isLoading={isRefreshing}
                searchable
                searchPlaceholder="Cari tuntutan..."
                filter={{
                  columnId: "status",
                  label: "Status",
                  options: Object.entries(CLAIM_STATUS_LABELS).map(
                    ([value, label]) => ({ value, label })
                  ),
                }}
                emptyIcon={<IconInbox />}
                emptyTitle="Tiada tuntutan"
                emptyDescription="Cipta tuntutan supaya subjek boleh terima profil ini."
              />
            </Section>
          </PermissionGate>
        </TabsContent>

        <TabsContent id="history">
          <ProfileAuditTab profileId={profile.id} />
        </TabsContent>

        <TabsContent id="timeline">
          {apiMode ? (
            <AsyncStateBanner
              error={timelinePaginated.error}
              onRetry={() => {
                void timelinePaginated.reload()
              }}
            />
          ) : null}
          <DataTable
            columns={timelineColumns}
            data={timeline}
            getRowId={(row) => row.id}
            isLoading={timelineLoading}
            errorMessage={timelineError}
            onRetry={() => {
              void timelinePaginated.reload()
            }}
            manualPagination={apiMode}
            pageIndex={apiMode ? timelinePaginated.page - 1 : undefined}
            pageCount={apiMode ? timelinePaginated.data?.totalPages : undefined}
            rowCount={apiMode ? timelinePaginated.data?.total : undefined}
            onPageChange={(pageIndex) =>
              timelinePaginated.setPage(pageIndex + 1)
            }
            onPageSizeChange={(nextSize) => {
              timelinePaginated.setPerPage(nextSize)
              timelinePaginated.setPage(1)
            }}
            searchable={!apiMode}
            searchPlaceholder="Cari aktiviti..."
            filter={
              apiMode
                ? undefined
                : {
                    columnId: "kind",
                    label: "Jenis",
                    options: Object.entries(TIMELINE_KIND_LABELS).map(
                      ([value, label]) => ({ value, label })
                    ),
                  }
            }
            toolbarStart={
              <div className="space-y-1">
                <h2 className="font-heading text-lg tracking-tight">
                  Timeline
                </h2>
                <p className="text-sm text-muted-foreground">
                  {apiMode
                    ? "Log jagaan dari API timeline (paginated)."
                    : "Log, dos ubat, temujanji, vital, tugasan dan dokumen."}
                </p>
              </div>
            }
            emptyIcon={<IconInbox />}
            emptyTitle="Tiada aktiviti lagi"
            emptyDescription="Rekod jagaan akan muncul di sini."
          />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        isOpen={destructiveAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDestructiveAction(null)
          }
        }}
        title={
          destructiveAction
            ? destructiveTableCopy(destructiveAction).title
            : "Sahkan tindakan"
        }
        description={
          destructiveAction
            ? destructiveTableCopy(destructiveAction).description
            : ""
        }
        confirmLabel={
          destructiveAction
            ? destructiveTableCopy(destructiveAction).confirmLabel
            : "Teruskan"
        }
        variant="destructive"
        onConfirm={() => {
          if (!destructiveAction) {
            return
          }
          if (destructiveAction.kind === "removeMember") {
            void removeMember(profileId, destructiveAction.userId)
          }
          if (destructiveAction.kind === "revokeInvite") {
            void revokeInvite(profileId, destructiveAction.id)
          }
          if (destructiveAction.kind === "revokeClaim") {
            void revokeClaim(profileId, destructiveAction.id)
          }
        }}
      />

      <ConfirmDialog
        isOpen={archiveOpen}
        onOpenChange={setArchiveOpen}
        title="Arkib profil?"
        description="Profil diarkib kekal boleh dibaca, tetapi rekod baharu tidak ditambah."
        confirmLabel="Arkib"
        variant="destructive"
        onConfirm={() => {
          void archiveProfile(profile.id)
        }}
      />
    </div>
  )
}

/**
 * One heading treatment for a group of related controls.
 *
 * The access tab titled its groups two different ways - an h2 with a
 * paragraph inside DataTable's toolbar in some places, a Card header in
 * others - so sections that are peers did not read as peers.
 */
function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="space-y-1">
        <h2 className="font-heading text-lg tracking-tight">{title}</h2>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  )
}

function PermissionEditor({
  name,
  role,
  permissions,
  onCancel,
  onSave,
}: {
  name: string
  role: CareRole
  permissions: CarePermissions
  onCancel: () => void
  onSave: (role: CareRole, permissions: CarePermissions) => void
}) {
  const [nextRole, setNextRole] = useState<CareRole>(role)
  const [nextPermissions, setNextPermissions] = useState(permissions)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Keizinan {name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Field>
          <FieldLabel>Peranan</FieldLabel>
          <Select
            className="w-full"
            value={nextRole}
            onChange={(key) => setNextRole(String(key) as CareRole)}
          >
            <SelectTrigger size="xl" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CARE_ROLES.map((item) => (
                <SelectItem key={item} id={item}>
                  {ROLE_LABELS[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          {CARE_PERMISSIONS.map((permission) => (
            <Field key={permission} orientation="horizontal">
              <FieldLabel className="flex-1 font-normal">
                {PERMISSION_LABELS[permission]}
              </FieldLabel>
              <Switch
                isSelected={nextPermissions[permission]}
                onChange={(value) =>
                  setNextPermissions((current) => ({
                    ...current,
                    [permission]: value,
                  }))
                }
                aria-label={PERMISSION_LABELS[permission]}
              />
            </Field>
          ))}
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline" onPress={onCancel}>
          Batal
        </Button>
        <Button onPress={() => onSave(nextRole, nextPermissions)}>
          Simpan
        </Button>
      </CardFooter>
    </Card>
  )
}
