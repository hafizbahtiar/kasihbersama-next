"use client"

import { IconHeartHandshake, IconStethoscope } from "@tabler/icons-react"

import { usePlatform } from "@/components/platform/platform-provider"
import { createDataTableColumnHelper, DataTable } from "@/components/data-table"
import { StatusChip } from "@/components/status-chip"
import { LinkButton } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useCaredPersons, type CaredPerson } from "@/hooks/use-cared-persons"
import { ACCESS_LEVEL_LABELS, ageLabel } from "@/lib/domain/circle"

/**
 * Pintasan: setiap orang yang pengguna ini jaga, merentas semua circlenya.
 *
 * Skrin circle menjawab "siapa dalam circle ini". Skrin ini menjawab soalan yang
 * sebenarnya ditanya setiap hari - "buka rekod ibu" - tanpa perlu ingat circle
 * mana dia berada.
 */
export function CaredPersonsPage() {
  const { circles } = usePlatform()
  const persons = useCaredPersons(circles)

  const helper = createDataTableColumnHelper<CaredPerson>()
  const columns = helper.columns([
    helper.accessor("fullName", {
      header: "Nama",
      cell: ({ row }) => (
        <div className="min-w-0 space-y-0.5">
          <p className="font-medium">{row.original.fullName}</p>
          {row.original.preferredName ? (
            <p className="text-xs text-muted-foreground">
              {row.original.preferredName}
            </p>
          ) : null}
        </div>
      ),
    }),
    helper.accessor("circleName", {
      header: "Circle",
      filterFn: "equalsString",
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{getValue()}</span>
      ),
    }),
    helper.accessor((row) => row.ageYears ?? -1, {
      id: "age",
      header: "Umur",
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular-nums">
          {ageLabel(row.original.ageYears, row.original.ageMonths)}
        </span>
      ),
    }),
    helper.accessor("accessLevel", {
      header: "Status",
      filterFn: "equalsString",
      cell: ({ getValue }) => (
        <StatusChip
          tone={getValue() === "full" ? "positive" : "neutral"}
          label={ACCESS_LEVEL_LABELS[getValue()]}
        />
      ),
    }),
    helper.display({
      id: "action",
      header: () => <span className="flex justify-end">Tindakan</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <LinkButton
            href={`/persons/${row.original.circleId}/${row.original.id}`}
            variant="outline"
            size="sm"
          >
            <IconStethoscope />
            Kesihatan
          </LinkButton>
        </div>
      ),
    }),
  ])

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl tracking-tight">Orang dijaga</h1>
        <p className="text-sm text-muted-foreground">
          Semua orang dalam jagaan anda, merentas setiap circle.
        </p>
      </div>

      <Alert>
        <IconHeartHandshake />
        <AlertDescription>
          Pintasan sahaja. Menambah atau membuang orang berlaku dalam circle yang
          memilikinya.
        </AlertDescription>
      </Alert>

      <DataTable
        columns={columns}
        data={persons.data}
        getRowId={(row) => `${row.circleId}:${row.id}`}
        isLoading={persons.isLoading}
        pageSize={10}
        emptyIcon={<IconHeartHandshake />}
        emptyTitle="Belum ada orang dalam jagaan anda"
        emptyDescription="Tambah orang dalam circle anda, atau minta ahli lain berkongsi akses."
      />
    </div>
  )
}
