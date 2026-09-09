"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { IconEye, IconInbox, IconPencil, IconPlus } from "@tabler/icons-react"

import { useCareData } from "@/components/care/care-data-provider"
import { ProfileStatusBadge } from "@/components/care/status-badges"
import {
  createDataTableColumnHelper,
  DataTable,
} from "@/components/data-table"
import { TableActionButton, TableActions } from "@/components/table-actions"
import { Button } from "@/components/ui/button"
import {
  PROFILE_STATUS_LABELS,
  ROLE_LABELS,
  type CareProfile,
} from "@/lib/domain/care"

type ProfileRow = CareProfile & {
  circleName: string
  memberCount: number
}

export function ProfilesPage() {
  const router = useRouter()
  const { snapshot, isRefreshing, setSelectedProfileId } = useCareData()

  const rows = useMemo<ProfileRow[]>(
    () =>
      snapshot.profiles.map((profile) => ({
        ...profile,
        circleName:
          snapshot.circles.find((item) => item.id === profile.circleId)?.name ??
          "—",
        memberCount: snapshot.members.filter(
          (item) => item.profileId === profile.id
        ).length,
      })),
    [snapshot]
  )

  const columns = useMemo(() => {
    const helper = createDataTableColumnHelper<ProfileRow>()
    return helper.columns([
      helper.accessor("displayName", { header: "Nama" }),
      helper.accessor("relation", { header: "Hubungan" }),
      helper.accessor("circleName", { header: "Kumpulan" }),
      helper.accessor((row) => ROLE_LABELS[row.role], {
        id: "role",
        header: "Peranan",
      }),
      helper.accessor("memberCount", { header: "Ahli" }),
      helper.accessor("status", {
        header: "Status",
        filterFn: "equalsString",
        enableColumnFilter: true,
        cell: ({ getValue }) => <ProfileStatusBadge value={getValue()} />,
      }),
      helper.display({
        id: "action",
        header: () => <span className="flex justify-end">Action</span>,
        enableSorting: false,
        enableGlobalFilter: false,
        enableColumnFilter: false,
        cell: ({ row }) => (
          <TableActions>
            <TableActionButton
              aria-label={`Lihat ${row.original.displayName}`}
              onPress={() => {
                setSelectedProfileId(row.original.id)
                router.push(`/care-profiles/${row.original.id}`)
              }}
            >
              <IconEye />
              Lihat
            </TableActionButton>
            <TableActionButton
              aria-label={`Sunting ${row.original.displayName}`}
              onPress={() =>
                router.push(`/care-profiles/${row.original.id}/edit`)
              }
            >
              <IconPencil />
              Sunting
            </TableActionButton>
          </TableActions>
        ),
      }),
    ])
  }, [router, setSelectedProfileId])

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      isLoading={isRefreshing}
      searchable
      searchPlaceholder="Cari profil..."
      filter={{
        columnId: "status",
        label: "Status",
        options: Object.entries(PROFILE_STATUS_LABELS).map(([value, label]) => ({
          value,
          label,
        })),
      }}
      toolbarStart={
        <div className="space-y-1">
          <h1 className="font-heading text-2xl tracking-tight">Profil jagaan</h1>
          <p className="text-sm text-muted-foreground">
            Ahli yang anda jaga. Setiap rekod ubat, temujanji dan dokumen terikat
            kepada satu profil.
          </p>
        </div>
      }
      toolbarActions={
        <Button onPress={() => router.push("/care-profiles/new")}>
          <IconPlus />
          Tambah profil
        </Button>
      }
      emptyIcon={<IconInbox />}
      emptyTitle="Tiada profil lagi"
      emptyDescription="Tambah profil jagaan pertama untuk mula rekod penjagaan."
      emptyAction={
        <Button onPress={() => router.push("/care-profiles/new")}>
          <IconPlus />
          Tambah profil
        </Button>
      }
    />
  )
}
