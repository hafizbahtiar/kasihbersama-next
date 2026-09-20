"use client"

import { useState } from "react"
import { IconCheck, IconPlus, IconUsersGroup } from "@tabler/icons-react"
import { toast } from "sonner"

import { createDataTableColumnHelper, DataTable } from "@/components/data-table"
import { usePlatform } from "@/components/platform/platform-provider"
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
      // The new circle - and the membership that came with it - only exist in
      // bootstrap's answer, so the list is re-read rather than appended to.
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
    helper.accessor("name", {
      header: "Nama",
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{row.original.name}</span>
          {row.original.id === activeCircle?.id ? <Badge>Aktif</Badge> : null}
        </div>
      ),
    }),
    helper.accessor((row) => CIRCLE_TYPE_LABELS[row.type] ?? String(row.type), {
      id: "type",
      header: "Jenis",
    }),
    helper.accessor((row) => roleLabel(row.roleKey), {
      id: "role",
      header: "Peranan anda",
      cell: ({ getValue }) => <Badge variant="secondary">{getValue()}</Badge>,
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
        toolbarStart={
          <div className="space-y-1">
            <h2 className="font-heading text-lg tracking-tight">Circle anda</h2>
            <p className="text-sm text-muted-foreground">
              Circle aktif menentukan apa yang anda boleh lihat dan buat.
            </p>
          </div>
        }
        emptyIcon={<IconUsersGroup />}
        emptyTitle="Belum menyertai circle"
        emptyDescription="Cipta satu di bawah, atau terima jemputan yang dihantar ke e-mel anda."
      />

      <Card>
        <CardHeader>
          <CardTitle>Cipta circle</CardTitle>
          <CardDescription>
            Anda menjadi pemilik, dan boleh menjemput ahli selepas itu.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
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
        </CardContent>
        <CardFooter className="justify-end">
          <Button
            isDisabled={isSaving || name.trim().length === 0}
            onPress={() => {
              void createCircle()
            }}
          >
            <IconPlus />
            Cipta circle
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
