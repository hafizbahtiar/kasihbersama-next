"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { IconEye, IconInbox, IconPlus } from "@tabler/icons-react"

import { useCareData } from "@/components/care/care-data-provider"
import { createDataTableColumnHelper, DataTable } from "@/components/data-table"
import { TableActionButton, TableActions } from "@/components/table-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { CareCircle } from "@/lib/domain/care"

type CircleRow = CareCircle & {
  status: "active" | "archived"
  profileCount: number
}

export function CirclesPage() {
  const router = useRouter()
  const { snapshot, isRefreshing } = useCareData()

  const rows = useMemo<CircleRow[]>(
    () =>
      snapshot.circles.map((circle) => ({
        ...circle,
        status: circle.archived ? "archived" : "active",
        profileCount: circle.profileIds.length,
      })),
    [snapshot.circles]
  )

  const columns = useMemo(() => {
    const helper = createDataTableColumnHelper<CircleRow>()
    return helper.columns([
      helper.accessor("name", { header: "Nama" }),
      helper.accessor("description", {
        header: "Keterangan",
        cell: ({ getValue }) => (
          <span className="block max-w-xs truncate">{getValue()}</span>
        ),
      }),
      helper.accessor("profileCount", { header: "Profil" }),
      helper.accessor("status", {
        header: "Status",
        filterFn: "equalsString",
        enableColumnFilter: true,
        cell: ({ getValue }) =>
          getValue() === "archived" ? (
            <Badge variant="secondary">Diarkib</Badge>
          ) : (
            <Badge>Aktif</Badge>
          ),
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
              aria-label={`Lihat ${row.original.name}`}
              onPress={() => router.push(`/circles/${row.original.id}`)}
            >
              <IconEye />
              Lihat
            </TableActionButton>
          </TableActions>
        ),
      }),
    ])
  }, [router])

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      isLoading={isRefreshing}
      searchable
      searchPlaceholder="Cari kumpulan..."
      filter={{
        columnId: "status",
        label: "Status",
        options: [
          { value: "active", label: "Aktif" },
          { value: "archived", label: "Diarkib" },
        ],
      }}
      toolbarStart={
        <div className="space-y-1">
          <h1 className="font-heading text-2xl tracking-tight">
            Kumpulan jagaan
          </h1>
          <p className="text-sm text-muted-foreground">
            Kumpulkan beberapa profil, contohnya satu rumah.
          </p>
        </div>
      }
      toolbarActions={
        <Button onPress={() => router.push("/circles/new")}>
          <IconPlus />
          Tambah kumpulan
        </Button>
      }
      emptyIcon={<IconInbox />}
      emptyTitle="Tiada kumpulan lagi"
      emptyDescription="Cipta kumpulan pertama untuk mengaitkan profil jagaan."
      emptyAction={
        <Button onPress={() => router.push("/circles/new")}>
          <IconPlus />
          Tambah kumpulan
        </Button>
      }
    />
  )
}
