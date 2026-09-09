"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { IconEye, IconInbox, IconPlus } from "@tabler/icons-react"

import { AsyncStateBanner } from "@/components/care/async-state"
import { PageHeader } from "@/components/care/page-header"
import { PermissionGate } from "@/components/care/permission-gate"
import { MedicationStatusBadge } from "@/components/care/status-badges"
import {
  useCareData,
  useCareProfile,
} from "@/components/care/care-data-provider"
import { createDataTableColumnHelper, DataTable } from "@/components/data-table"
import { TableActionButton, TableActions } from "@/components/table-actions"
import { Button } from "@/components/ui/button"
import { usePaginatedCareResource } from "@/hooks/use-paginated-care-resource"
import { getCareRepository } from "@/lib/composition/care-repository"
import { isMockDataEnabled } from "@/lib/infrastructure/config"
import { MEDICATION_STATUS_LABELS, type Medication } from "@/lib/domain/care"
import { messageForApiError } from "@/lib/infrastructure/api/errors"

type MedicationRow = Medication & { pendingCount: number }

export function MedicationsPage() {
  const router = useRouter()
  const apiMode = !isMockDataEnabled()
  const { selectedProfile } = useCareProfile()
  const { snapshot, isRefreshing } = useCareData()

  const fetchMedications = useMemo(
    () => (profileId: string, params: { page?: number; perPage?: number }) =>
      getCareRepository().listMedications(profileId, params),
    []
  )

  const paginated = usePaginatedCareResource<Medication>({
    profileId: selectedProfile?.id,
    enabled: apiMode,
    fetcher: fetchMedications,
    initialPerPage: 10,
  })

  // Memoised: a fresh array each render would invalidate every downstream
  // useMemo that depends on it.
  const medications = useMemo(
    () =>
      apiMode
        ? (paginated.data?.data ?? [])
        : snapshot.medications.filter(
            (item) => item.profileId === selectedProfile?.id
          ),
    [apiMode, paginated.data?.data, selectedProfile?.id, snapshot.medications]
  )
  const isLoading = apiMode ? paginated.isLoading : isRefreshing
  const errorMessage =
    apiMode && paginated.error ? messageForApiError(paginated.error) : undefined

  const rows = useMemo<MedicationRow[]>(
    () =>
      medications.map((medication) => ({
        ...medication,
        pendingCount: snapshot.events.filter(
          (item) =>
            item.medicationId === medication.id &&
            item.actionStatus === "pending"
        ).length,
      })),
    [medications, snapshot.events]
  )

  const columns = useMemo(() => {
    const helper = createDataTableColumnHelper<MedicationRow>()
    const base = [
      helper.accessor("name", { header: "Nama" }),
      helper.accessor("dosage", { header: "Dos" }),
    ] as const
    // Returned by the API since 2026-09-09; these were mock-only columns.
    const prescription = [
      helper.accessor("prescribedBy", { header: "Prescriber" }),
      helper.accessor("startDate", { header: "Mula" }),
    ]
    const tail = [
      helper.accessor("beforeAfterMeal", { header: "Makanan" }),
      helper.accessor("pendingCount", { header: "Dos menunggu" }),
      helper.accessor("status", {
        header: "Status",
        filterFn: "equalsString",
        enableColumnFilter: !apiMode,
        cell: ({ getValue }) => <MedicationStatusBadge value={getValue()} />,
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
              onPress={() => router.push(`/medications/${row.original.id}`)}
            >
              <IconEye />
              Lihat
            </TableActionButton>
          </TableActions>
        ),
      }),
    ] as const
    return helper.columns([...base, ...prescription, ...tail])
  }, [apiMode, router])

  return (
    <div className="flex flex-col gap-5">
      {apiMode ? (
        <AsyncStateBanner
          error={paginated.error}
          onRetry={() => {
            void paginated.reload()
          }}
        />
      ) : null}

      <PageHeader
        title="Ubat"
        description="Ubat dan jadualnya. Tanda bila sudah diambil."
      />
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        errorMessage={errorMessage}
        onRetry={() => {
          void paginated.reload()
        }}
        manualPagination={apiMode}
        pageIndex={apiMode ? paginated.page - 1 : undefined}
        pageCount={apiMode ? paginated.data?.totalPages : undefined}
        rowCount={apiMode ? paginated.data?.total : undefined}
        onPageChange={(pageIndex) => paginated.setPage(pageIndex + 1)}
        onPageSizeChange={(nextSize) => {
          paginated.setPerPage(nextSize)
          paginated.setPage(1)
        }}
        searchable={!apiMode}
        searchPlaceholder="Cari ubat..."
        filter={
          apiMode
            ? undefined
            : {
                columnId: "status",
                label: "Status",
                options: Object.entries(MEDICATION_STATUS_LABELS).map(
                  ([value, label]) => ({ value, label })
                ),
              }
        }
        toolbarActions={
          <PermissionGate permission="can_edit_medication_setup">
            <Button onPress={() => router.push("/medications/new")}>
              <IconPlus />
              Tambah ubat
            </Button>
          </PermissionGate>
        }
        emptyIcon={<IconInbox />}
        emptyTitle="Tiada ubat lagi"
        emptyDescription="Tambah ubat pertama untuk profil ini."
        emptyAction={
          <PermissionGate permission="can_edit_medication_setup">
            <Button onPress={() => router.push("/medications/new")}>
              <IconPlus />
              Tambah ubat
            </Button>
          </PermissionGate>
        }
      />
    </div>
  )
}
