"use client"

import { IconHistory } from "@tabler/icons-react"

import { AsyncStateBanner } from "@/components/care/async-state"
import { PermissionGate } from "@/components/care/permission-gate"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuditEvents } from "@/hooks/use-care-admin"
import { formatDateTime } from "@/lib/application/care-format"
import { auditEventLabel } from "@/lib/domain/care"

/**
 * The profile's administrative history.
 *
 * Behind can_change_roles, matching the endpoint: the trail names who invited
 * whom and whose role changed, which is more than the roles that can only read
 * the timeline should see. The gate's fallback says so rather than rendering
 * an empty panel that reads as "nothing has happened".
 */
export function ProfileAuditTab({ profileId }: { profileId: string }) {
  const events = useAuditEvents(profileId)

  return (
    <PermissionGate
      permission="can_change_roles"
      fallback={
        <Card>
          <CardHeader>
            <CardTitle>Sejarah</CardTitle>
            <CardDescription>
              Hanya pentadbir profil boleh melihat jejak perubahan.
            </CardDescription>
          </CardHeader>
        </Card>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Sejarah</CardTitle>
          <CardDescription>
            Setiap perubahan ahli, peranan, jemputan dan tuntutan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AsyncStateBanner
            error={events.error}
            onRetry={() => {
              void events.reload()
            }}
            label="Gagal memuatkan sejarah."
          />

          {events.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : events.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada perubahan direkodkan.
            </p>
          ) : (
            <>
              <ItemGroup className="gap-3">
                {events.data.map((event) => (
                  <Item key={event.id} variant="muted">
                    <ItemMedia variant="icon">
                      <IconHistory />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{auditEventLabel(event.eventType)}</ItemTitle>
                      <ItemDescription>
                        {/* The snapshot name is what survives an account being
                            deleted, so it is always shown rather than an id. */}
                        {event.actorDisplayName} ·{" "}
                        {formatDateTime(event.createdAt)}
                      </ItemDescription>
                    </ItemContent>
                  </Item>
                ))}
              </ItemGroup>

              {events.totalPages > 1 ? (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    Halaman {events.page} daripada {events.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      isDisabled={events.page <= 1}
                      onPress={() => events.setPage(events.page - 1)}
                    >
                      Sebelum
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      isDisabled={!events.hasMore}
                      onPress={() => events.setPage(events.page + 1)}
                    >
                      Seterusnya
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </PermissionGate>
  )
}
