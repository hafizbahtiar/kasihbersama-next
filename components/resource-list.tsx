"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { IconEye, IconInbox, IconPencil, IconPlus } from "@tabler/icons-react"

import { createDataTableColumnHelper, DataTable } from "@/components/data-table"
import { TableActionButton, TableActions } from "@/components/table-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ResourceRecord, ResourceSchema } from "@/lib/domain/resource"

function statusVariant(value: string) {
  if (
    value === "Baharu" ||
    value === "Aktif" ||
    value === "Berjalan" ||
    value === "Sedang" ||
    value === "Akan datang" ||
    value === "Pengguna"
  ) {
    return "default" as const
  }

  return "secondary" as const
}

export function ResourceList({
  schema,
  records,
  showHeader = true,
  showCreate = true,
  showEdit = true,
  hiddenFields = ["notes", "detail"],
  createHref,
  createLabel,
  emptyTitle,
  emptyDescription,
}: {
  schema: ResourceSchema
  records: ResourceRecord[]
  showHeader?: boolean
  showCreate?: boolean
  showEdit?: boolean
  hiddenFields?: string[]
  createHref?: string
  createLabel?: string
  emptyTitle?: string
  emptyDescription?: string
}) {
  const router = useRouter()
  const newHref = createHref ?? `/${schema.slug}/new`
  const addLabel = createLabel ?? `Tambah ${schema.singular.toLowerCase()}`
  const statusField = schema.fields.find(
    (field) => field.name === "status" && field.type === "select"
  )

  const columns = useMemo(() => {
    const helper = createDataTableColumnHelper<ResourceRecord>()
    const hide = new Set(hiddenFields)
    const visibleFields = schema.fields.filter((field) => !hide.has(field.name))

    return helper.columns([
      ...visibleFields.map((field) =>
        helper.accessor(field.name, {
          header: field.label,
          filterFn: field.name === "status" ? "equalsString" : "includesString",
          enableColumnFilter: field.name === "status",
          cell: (info) => {
            const value = String(info.getValue() ?? "")
            if (field.name === "status" || field.name === "audience") {
              return <Badge variant={statusVariant(value)}>{value}</Badge>
            }
            return value
          },
        })
      ),
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
              onPress={() => router.push(`/${schema.slug}/${row.original.id}`)}
            >
              <IconEye />
              Lihat
            </TableActionButton>
            {showEdit ? (
              <TableActionButton
                aria-label={`Sunting ${row.original.name}`}
                onPress={() =>
                  router.push(`/${schema.slug}/${row.original.id}/edit`)
                }
              >
                <IconPencil />
                Sunting
              </TableActionButton>
            ) : null}
          </TableActions>
        ),
      }),
    ])
  }, [schema, router, hiddenFields, showEdit])

  return (
    <DataTable
      columns={columns}
      data={records}
      getRowId={(row) => row.id}
      searchable
      searchPlaceholder={`Cari ${schema.singular.toLowerCase()}...`}
      filter={
        statusField
          ? {
              columnId: "status",
              label: statusField.label,
              options: statusField.options ?? [],
            }
          : undefined
      }
      toolbarStart={
        showHeader ? (
          <div className="space-y-1">
            <h1 className="font-heading text-2xl tracking-tight">
              {schema.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {schema.description}
            </p>
          </div>
        ) : undefined
      }
      toolbarActions={
        showCreate ? (
          <Button onPress={() => router.push(newHref)}>
            <IconPlus />
            {addLabel}
          </Button>
        ) : undefined
      }
      emptyIcon={<IconInbox />}
      emptyTitle={emptyTitle ?? `Tiada ${schema.singular.toLowerCase()} lagi`}
      emptyDescription={
        emptyDescription ??
        `Tambah ${schema.singular.toLowerCase()} pertama untuk mula rekod jagaan.`
      }
      emptyAction={
        showCreate ? (
          <Button onPress={() => router.push(newHref)}>
            <IconPlus />
            {addLabel}
          </Button>
        ) : undefined
      }
    />
  )
}
