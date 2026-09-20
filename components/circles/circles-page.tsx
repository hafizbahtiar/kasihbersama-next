"use client"

import { useState } from "react"
import { IconCheck, IconUsersGroup } from "@tabler/icons-react"
import { toast } from "sonner"

import { createDataTableColumnHelper, DataTable } from "@/components/data-table"
import { usePlatform } from "@/components/platform/platform-provider"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { StatusChip } from "@/components/status-chip"
import { TableActionButton, TableActions } from "@/components/table-actions"
import { Button, LinkButton } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getCircleRepository } from "@/lib/composition/circle-repository"
import {
  CIRCLE_TYPE_LABELS,
  roleLabel,
  type CircleMembership,
  type CircleType,
} from "@/lib/domain/circle"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"

const CIRCLE_TYPES = Object.keys(CIRCLE_TYPE_LABELS) as CircleType[]

export function CirclesPage() {
  const { circles, activeCircle, isLoading, refresh, switchCircle } =
    usePlatform()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState<CircleType>("family")
  const [isSaving, setIsSaving] = useState(false)
  const [switching, setSwitching] = useState<string | null>(null)

  async function createCircle() {
    if (!name.trim()) {
      return
    }
    setIsSaving(true)
    try {
      await getCircleRepository().createCircle({ name: name.trim(), type })
      setName("")
      setIsCreateOpen(false)
      // Circle baharu - dan keahlian yang datang bersamanya - hanya wujud dalam
      // jawapan bootstrap, jadi senarai dibaca semula dan bukan ditambah sendiri.
      await refresh()
      toast.success("Circle dicipta.")
    } catch (cause) {
      toast.error(
        isApiError(cause) ? messageForApiError(cause) : "Gagal mencipta circle."
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function makeActive(circleId: string) {
    setSwitching(circleId)
    try {
      await switchCircle(circleId)
      toast.success("Circle aktif ditukar.")
    } catch (cause) {
      toast.error(
        isApiError(cause) ? messageForApiError(cause) : "Gagal menukar circle."
      )
    } finally {
      setSwitching(null)
    }
  }

  // Tanpa useMemo: React Compiler yang memoize komponen ini.
  const helper = createDataTableColumnHelper<CircleMembership>()
  const columns = helper.columns([
    helper.accessor("name", { header: "Nama" }),
    helper.accessor((row) => CIRCLE_TYPE_LABELS[row.type] ?? String(row.type), {
      id: "type",
      header: "Jenis",
    }),
    helper.accessor((row) => roleLabel(row.roleKey), {
      id: "role",
      header: "Peranan anda",
    }),
    helper.accessor((row) => (row.id === activeCircle?.id ? "aktif" : "lain"), {
      id: "status",
      header: "Status",
      filterFn: "equalsString",
      cell: ({ getValue }) =>
        getValue() === "aktif" ? (
          <StatusChip tone="positive" label="Aktif" />
        ) : (
          <StatusChip tone="neutral" label="Tidak aktif" />
        ),
    }),
    helper.display({
      id: "action",
      header: () => <span className="flex justify-end">Tindakan</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <TableActions>
          {row.original.id === activeCircle?.id ? null : (
            <TableActionButton
              aria-label={`Jadikan ${row.original.name} aktif`}
              isDisabled={switching !== null}
              onPress={() => {
                void makeActive(row.original.id)
              }}
            >
              <IconCheck />
              Jadikan aktif
            </TableActionButton>
          )}
          <LinkButton
            href={`/circles/${row.original.id}`}
            variant="outline"
            size="sm"
            className="px-2"
          >
            Urus
          </LinkButton>
        </TableActions>
      ),
    }),
  ])

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl tracking-tight">Circle</h1>
        <p className="text-sm text-muted-foreground">
          Keluarga atau kumpulan penjagaan yang anda sertai.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={circles}
        getRowId={(row) => row.id}
        isLoading={isLoading && circles.length === 0}
        searchable={circles.length > 0}
        searchPlaceholder="Cari circle..."
        pageSize={10}
        addLabel="Cipta circle"
        onAdd={() => setIsCreateOpen(true)}
        emptyIcon={<IconUsersGroup />}
        emptyTitle="Belum menyertai circle"
        emptyDescription="Cipta satu, atau terima jemputan yang dihantar ke e-mel anda."
      />

      <ResponsiveDialog
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Cipta circle"
        description="Anda menjadi pemilik, dan boleh menjemput ahli selepas itu."
        footer={
          <>
            <Button variant="outline" onPress={() => setIsCreateOpen(false)}>
              Batal
            </Button>
            <Button
              isDisabled={isSaving || name.trim().length === 0}
              onPress={() => {
                void createCircle()
              }}
            >
              Cipta
            </Button>
          </>
        }
      >
        <Field>
          <FieldLabel htmlFor="circle-name">Nama</FieldLabel>
          <Input
            id="circle-name"
            value={name}
            placeholder="Contoh: Rumah Bukit"
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>Jenis</FieldLabel>
          <Select
            className="w-full"
            aria-label="Jenis circle"
            value={type}
            onChange={(key) => setType(String(key ?? "family") as CircleType)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CIRCLE_TYPES.map((key) => (
                <SelectItem key={key} id={key}>
                  {CIRCLE_TYPE_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </ResponsiveDialog>
    </div>
  )
}
