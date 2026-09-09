"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { IconInbox, IconPlus } from "@tabler/icons-react"

import { AsyncStateBanner } from "@/components/care/async-state"
import { useCareData, useCareProfile } from "@/components/care/care-data-provider"
import {
  numericChartConfig,
  pressureChartConfig,
  toNumericChartData,
  toPressureChartData,
  VitalChartWidget,
} from "@/components/care/vital-chart-widget"
import {
  createDataTableColumnHelper,
  DataTable,
} from "@/components/data-table"
import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { usePaginatedCareResource } from "@/hooks/use-paginated-care-resource"
import { formatDateTime } from "@/lib/application/care-format"
import { getCareRepository } from "@/lib/composition/care-repository"
import { isMockDataEnabled } from "@/lib/composition/config"
import { VITAL_TYPE_OPTIONS, type VitalReading } from "@/lib/domain/care"
import { messageForApiError } from "@/lib/infrastructure/api/errors"

function vitalValue(item: VitalReading) {
  if (item.systolic != null && item.diastolic != null) {
    return `${item.systolic}/${item.diastolic}`
  }
  return String(item.valueNumeric ?? item.valueText ?? "—")
}

export function VitalsPage() {
  const router = useRouter()
  const apiMode = !isMockDataEnabled()
  const { selectedProfile } = useCareProfile()
  const { snapshot, isRefreshing } = useCareData()

  const fetchVitals = useMemo(
    () => (profileId: string, params: { page?: number; perPage?: number }) =>
      getCareRepository().listVitals(profileId, params),
    []
  )

  const paginated = usePaginatedCareResource<VitalReading>({
    profileId: selectedProfile?.id,
    enabled: apiMode,
    fetcher: fetchVitals,
    initialPerPage: 10,
  })

  const mockVitals = snapshot.vitals.filter(
    (item) => item.profileId === selectedProfile?.id
  )
  const vitals = apiMode ? (paginated.data?.data ?? []) : mockVitals
  const chartVitals = apiMode ? vitals : mockVitals
  const isLoading = apiMode ? paginated.isLoading : isRefreshing
  const errorMessage =
    apiMode && paginated.error ? messageForApiError(paginated.error) : undefined

  const columns = useMemo(() => {
    const helper = createDataTableColumnHelper<VitalReading>()
    return helper.columns([
      helper.accessor(
        (row) =>
          VITAL_TYPE_OPTIONS.find((item) => item.value === row.readingType)
            ?.label ?? row.readingType,
        { id: "readingType", header: "Jenis" }
      ),
      helper.accessor((row) => vitalValue(row), { id: "value", header: "Nilai" }),
      helper.accessor((row) => row.unit ?? "—", { id: "unit", header: "Unit" }),
      helper.accessor("measuredAt", {
        header: "Masa",
        cell: ({ getValue }) => formatDateTime(getValue()),
      }),
      helper.accessor((row) => row.note ?? "—", {
        id: "note",
        header: "Nota",
        cell: ({ getValue }) => (
          <span className="block max-w-xs truncate">{getValue()}</span>
        ),
      }),
    ])
  }, [])

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

      <div className="space-y-1">
        <h1 className="font-heading text-2xl tracking-tight">Bacaan vital</h1>
        <p className="text-sm text-muted-foreground">
          Nilai nombor atau teks, unit, sistolik/diastolik, dan carta trend.
        </p>
      </div>

      <Tabs defaultSelectedKey="table" className="gap-5">
        <TabsList>
          <TabsTrigger id="table">Jadual</TabsTrigger>
          <TabsTrigger id="chart">Carta</TabsTrigger>
        </TabsList>

        <TabsContent id="table">
          <DataTable
            columns={columns}
            data={vitals}
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
            searchPlaceholder="Cari bacaan..."
            toolbarActions={
              <Button onPress={() => router.push("/vitals/new")}>
                <IconPlus />
                Tambah bacaan
              </Button>
            }
            emptyIcon={<IconInbox />}
            emptyTitle="Tiada bacaan lagi"
            emptyDescription="Simpan bacaan pertama untuk profil ini."
            emptyAction={
              <Button onPress={() => router.push("/vitals/new")}>
                <IconPlus />
                Tambah bacaan
              </Button>
            }
          />
        </TabsContent>

        <TabsContent id="chart">
          {apiMode ? (
            <p className="mb-3 text-xs text-muted-foreground">
              Carta memaparkan bacaan pada halaman jadual semasa.
            </p>
          ) : null}
          <div className="grid gap-4 xl:grid-cols-2">
            <VitalChartWidget
              title="Tekanan darah"
              description="Trend sistolik dan diastolik."
              data={toPressureChartData(chartVitals)}
              config={pressureChartConfig}
              series={[
                { dataKey: "systolic", color: "var(--color-systolic)" },
                { dataKey: "diastolic", color: "var(--color-diastolic)" },
              ]}
            />
            <VitalChartWidget
              title="Gula darah"
              description="mmol/L merentasi hari terakhir."
              data={toNumericChartData(chartVitals, "blood_glucose")}
              config={numericChartConfig}
              series={[{ dataKey: "value", color: "var(--color-value)" }]}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
