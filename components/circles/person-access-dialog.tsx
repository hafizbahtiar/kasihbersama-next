"use client"

import { useCallback, useState } from "react"
import { IconShieldLock } from "@tabler/icons-react"
import { toast } from "sonner"

import { createDataTableColumnHelper, DataTable } from "@/components/data-table"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { StatusChip } from "@/components/status-chip"
import { TableActionButton, TableActions } from "@/components/table-actions"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePersonAccess } from "@/hooks/use-person-access"
import { getCircleRepository } from "@/lib/composition/circle-repository"
import {
  ACCESS_LEVEL_LABELS,
  type CircleMember,
  type CirclePerson,
  type PersonAccessGrant,
  type PersonAccessLevel,
} from "@/lib/domain/circle"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"

const LEVELS: PersonAccessLevel[] = ["summary", "full"]

/**
 * Who may see one person, and how much of them.
 *
 * Without a grant a person is visible to its creator alone - `CreatePerson`
 * writes one `person_access` row for the member who made it - so this dialog
 * is the only way a family record stops being a record of one.
 *
 * Mounted only while open, so `isOpen` is always true here.
 */
export function PersonAccessDialog({
  circleId,
  person,
  members,
  onOpenChange,
}: {
  circleId: string
  person: CirclePerson
  members: CircleMember[]
  onOpenChange: (open: boolean) => void
}) {
  const {
    data: grants,
    isLoading,
    error,
    reload,
  } = usePersonAccess(circleId, person.id)
  const [memberId, setMemberId] = useState("")
  const [level, setLevel] = useState<PersonAccessLevel>("summary")
  const [busy, setBusy] = useState(false)

  // Only an active membership can hold a grant: the same circle, and not
  // suspended. The server rejects the rest, so offering them would be an
  // error message pretending to be a choice.
  const candidates = members.filter((member) => member.status === "active")

  const run = useCallback(
    async (action: Promise<unknown>, done: string) => {
      setBusy(true)
      try {
        await action
        toast.success(done)
        await reload()
      } catch (cause) {
        toast.error(
          isApiError(cause) ? messageForApiError(cause) : "Tindakan gagal."
        )
      } finally {
        setBusy(false)
      }
    },
    [reload]
  )

  // Tanpa useMemo: React Compiler yang memoize komponen ini (lihat circle-detail).
  const helper = createDataTableColumnHelper<PersonAccessGrant>()
  const columns = helper.columns([
    helper.accessor("displayName", {
      header: "Ahli",
      cell: ({ row }) => (
        <div className="min-w-0 space-y-0.5">
          <p className="font-medium">{row.original.displayName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {row.original.email}
          </p>
        </div>
      ),
    }),
    helper.accessor("level", {
      header: "Tahap",
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
        <TableActions>
          <TableActionButton
            aria-label={`Tarik balik akses ${row.original.displayName}`}
            isDisabled={busy}
            onPress={() => {
              void run(
                getCircleRepository().revokePersonAccess(
                  circleId,
                  person.id,
                  row.original.memberId
                ),
                "Akses ditarik balik."
              )
            }}
          >
            Tarik balik
          </TableActionButton>
        </TableActions>
      ),
    }),
  ])

  return (
    <ResponsiveDialog
      isOpen
      onOpenChange={onOpenChange}
      title="Akses kepada person"
      description={`Siapa boleh melihat ${person.fullName}.`}
      className="sm:max-w-2xl"
      footer={
        <Button variant="outline" onPress={() => onOpenChange(false)}>
          Tutup
        </Button>
      }
    >
      <FieldGroup>
        <Field>
          <FieldLabel>Beri akses kepada ahli</FieldLabel>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              className="w-full"
              aria-label="Ahli"
              value={memberId}
              onChange={(key) => setMemberId(String(key ?? ""))}
            >
              <SelectTrigger size="xl" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((member) => (
                  <SelectItem key={member.id} id={member.id}>
                    {member.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              className="w-full sm:w-40"
              aria-label="Tahap akses"
              value={level}
              onChange={(key) => {
                const next = String(key ?? "")
                if (next === "summary" || next === "full") {
                  setLevel(next)
                }
              }}
            >
              <SelectTrigger size="xl" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((option) => (
                  <SelectItem key={option} id={option}>
                    {ACCESS_LEVEL_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              isDisabled={busy || memberId === ""}
              onPress={() => {
                void run(
                  getCircleRepository().grantPersonAccess(
                    circleId,
                    person.id,
                    memberId,
                    level
                  ),
                  "Akses diberi."
                )
              }}
            >
              Beri akses
            </Button>
          </div>
          <FieldDescription>
            Ringkasan: nama, umur dan jantina sahaja. Penuh: termasuk tarikh
            lahir dan nota, mengikut polisi field.
          </FieldDescription>
        </Field>
      </FieldGroup>

      <DataTable
        columns={columns}
        data={grants}
        getRowId={(row) => row.memberId}
        isLoading={isLoading}
        errorMessage={error ? messageForApiError(error) : undefined}
        onRetry={() => {
          void reload()
        }}
        paginate={false}
        showColumnToggle={false}
        emptyIcon={<IconShieldLock />}
        emptyTitle="Tiada geran akses"
        emptyDescription="Hanya pencipta person boleh melihatnya sehingga geran pertama diberi."
      />
    </ResponsiveDialog>
  )
}
