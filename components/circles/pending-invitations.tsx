"use client"

import { useCallback, useState } from "react"
import { IconMailForward, IconMailOff } from "@tabler/icons-react"
import { toast } from "sonner"

import { createDataTableColumnHelper, DataTable } from "@/components/data-table"
import { usePlatform } from "@/components/platform/platform-provider"
import { StatusChip } from "@/components/status-chip"
import { TableActionButton, TableActions } from "@/components/table-actions"
import {
  usePendingInvitations,
  type PendingInvitation,
} from "@/hooks/use-pending-invitations"
import { useDisplayFormat } from "@/lib/application/display-preferences"
import { getCircleRepository } from "@/lib/composition/circle-repository"
import { roleLabel } from "@/lib/domain/circle"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"

/**
 * Invitations that have been sent and not yet answered, across every circle.
 *
 * They live here and not on the circle's own page because the question people ask is
 * "who have I invited that hasn't replied?" - which is not scoped to one circle. The
 * server is still the authority on who may revoke what; a refused circle is simply not
 * listed.
 */
export function PendingInvitations() {
  const { circles } = usePlatform()
  const invitations = usePendingInvitations(circles)
  const { date } = useDisplayFormat()
  const [busy, setBusy] = useState(false)

  const revoke = useCallback(
    async (invitation: PendingInvitation) => {
      setBusy(true)
      try {
        await getCircleRepository().revokeInvitation(
          invitation.circleId,
          invitation.id
        )
        toast.success("Jemputan dibatalkan.")
        await invitations.reload()
      } catch (cause) {
        toast.error(
          isApiError(cause) ? messageForApiError(cause) : "Tindakan gagal."
        )
      } finally {
        setBusy(false)
      }
    },
    [invitations]
  )

  // Tanpa useMemo: React Compiler yang memoize komponen ini (lihat circle-detail).
  const helper = createDataTableColumnHelper<PendingInvitation>()
  const columns = helper.columns([
    helper.accessor("circleName", { header: "Circle" }),
    helper.accessor("email", { header: "E-mel" }),
    helper.accessor((row) => roleLabel(row.roleKey), {
      id: "role",
      header: "Peranan",
    }),
    helper.accessor("status", {
      header: "Status",
      // Senarai ini hanya membawa jemputan yang menunggu, jadi satu-satunya nada yang
      // betul ialah "menunggu seseorang".
      cell: () => <StatusChip tone="attention" label="Menunggu" />,
    }),
    helper.accessor("expiresAt", {
      header: "Tamat",
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{date(getValue())}</span>
      ),
    }),
    helper.display({
      id: "action",
      header: () => <span className="flex justify-end">Tindakan</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <TableActions>
          <TableActionButton
            aria-label={`Batalkan jemputan ${row.original.email}`}
            isDisabled={busy}
            onPress={() => {
              void revoke(row.original)
            }}
          >
            <IconMailOff />
            Batalkan
          </TableActionButton>
        </TableActions>
      ),
    }),
  ])

  return (
    <DataTable
      columns={columns}
      data={invitations.data}
      getRowId={(row) => `${row.circleId}:${row.id}`}
      isLoading={invitations.isLoading}
      errorMessage={
        invitations.error ? messageForApiError(invitations.error) : undefined
      }
      onRetry={() => {
        void invitations.reload()
      }}
      searchable
      searchPlaceholder="Cari jemputan..."
      pageSize={10}
      emptyIcon={<IconMailForward />}
      emptyTitle="Tiada jemputan menunggu"
      emptyDescription="Jemputan yang sudah diterima muncul sebagai ahli dalam circle itu."
    />
  )
}
