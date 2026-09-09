"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { IconEye, IconInbox } from "@tabler/icons-react"

import { BackButton } from "@/components/back-button"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { PageHeader } from "@/components/care/page-header"
import { ProfileStatusBadge } from "@/components/care/status-badges"
import { useCareData } from "@/components/care/care-data-provider"
import {
  createDataTableColumnHelper,
  DataTable,
} from "@/components/data-table"
import { TableActionButton, TableActions } from "@/components/table-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ROLE_LABELS, type CareProfile } from "@/lib/domain/care"

export function CircleDetailPage({ circleId }: { circleId: string }) {
  const router = useRouter()
  const {
    snapshot,
    linkProfileToCircle,
    archiveCircle,
    updateCircle,
    isRefreshing,
  } = useCareData()
  const circle = snapshot.circles.find((item) => item.id === circleId)
  const [profileToLink, setProfileToLink] = useState("")
  const [archiveOpen, setArchiveOpen] = useState(false)

  const linked = useMemo(
    () =>
      snapshot.profiles.filter((item) => circle?.profileIds.includes(item.id)),
    [circle, snapshot.profiles]
  )
  const available = snapshot.profiles.filter(
    (item) => !circle?.profileIds.includes(item.id) && item.status === "active"
  )

  const columns = useMemo(() => {
    const helper = createDataTableColumnHelper<CareProfile>()
    return helper.columns([
      helper.accessor("displayName", { header: "Nama" }),
      helper.accessor("relation", { header: "Hubungan" }),
      helper.accessor((row) => ROLE_LABELS[row.role], {
        id: "role",
        header: "Peranan",
      }),
      helper.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => <ProfileStatusBadge value={getValue()} />,
      }),
      helper.display({
        id: "action",
        header: () => <span className="flex justify-end">Action</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <TableActions>
            <TableActionButton
              aria-label={`Buka ${row.original.displayName}`}
              onPress={() => router.push(`/care-profiles/${row.original.id}`)}
            >
              <IconEye />
              Buka
            </TableActionButton>
          </TableActions>
        ),
      }),
    ])
  }, [router])

  if (!circle) {
    return (
      <div className="flex flex-col gap-4">
        <BackButton href="/circles" />
        <p className="text-sm text-muted-foreground">Kumpulan tidak dijumpai.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <BackButton href="/circles" />
      <PageHeader
        title={circle.name}
        description={circle.description}
        actions={
          circle.archived ? (
            <Button
              variant="outline"
              onPress={() => {
                void updateCircle(circle.id, { archived: false })
              }}
            >
              Aktifkan
            </Button>
          ) : (
            <Button variant="destructive" onPress={() => setArchiveOpen(true)}>
              Arkib kumpulan
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={linked}
        getRowId={(row) => row.id}
        isLoading={isRefreshing}
        searchable
        searchPlaceholder="Cari profil..."
        toolbarStart={
          <div className="space-y-1">
            <h2 className="font-heading text-lg tracking-tight">
              Profil dalam kumpulan
            </h2>
            <p className="text-sm text-muted-foreground">
              Kaitkan profil sedia ada kepada kumpulan ini.
            </p>
          </div>
        }
        toolbarActions={
          circle.archived ? (
            <Badge variant="secondary">Kumpulan diarkib</Badge>
          ) : (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <Select
                className="w-full sm:w-52"
                selectedKey={profileToLink || null}
                onSelectionChange={(key) => setProfileToLink(String(key ?? ""))}
                placeholder="Pilih profil"
              >
                <SelectTrigger className="h-8 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {available.map((profile) => (
                    <SelectItem key={profile.id} id={profile.id}>
                      {profile.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onPress={() => {
                  if (!profileToLink) {
                    return
                  }
                  void linkProfileToCircle(profileToLink, circle.id).then(() =>
                    setProfileToLink("")
                  )
                }}
              >
                Kaitkan
              </Button>
            </div>
          )
        }
        emptyIcon={<IconInbox />}
        emptyTitle="Belum ada profil"
        emptyDescription="Pilih profil aktif untuk dikaitkan dengan kumpulan ini."
      />

      <ConfirmDialog
        isOpen={archiveOpen}
        onOpenChange={setArchiveOpen}
        title="Arkib kumpulan?"
        description="Profil akan dilepaskan daripada kumpulan ini."
        confirmLabel="Arkib"
        variant="destructive"
        onConfirm={() => {
          void archiveCircle(circle.id)
        }}
      />
    </div>
  )
}
