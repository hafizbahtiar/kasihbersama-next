"use client"

import { IconBell, IconCheck, IconChecks } from "@tabler/icons-react"
import { toast } from "sonner"

import { usePlatform } from "@/components/platform/platform-provider"
import { AsyncStateBanner } from "@/components/shared/async-state"
import { Badge } from "@/components/ui/badge"
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
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import { useNotifications } from "@/hooks/use-notifications"
import { useDisplayFormat } from "@/lib/application/display-preferences"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"

export function NotificationInbox() {
  const inbox = useNotifications()
  const { dateTime } = useDisplayFormat()
  const { refresh: refreshBootstrap } = usePlatform()

  async function run(action: Promise<void>, done: string) {
    try {
      await action
      toast.success(done)
      // The unread badge lives in bootstrap, so it has to be re-read - the
      // count is the server's, not a number this screen decrements.
      void refreshBootstrap()
    } catch (cause) {
      toast.error(
        isApiError(cause) ? messageForApiError(cause) : "Tindakan gagal."
      )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pemberitahuan</CardTitle>
        <CardDescription>
          Amaran keselamatan, jemputan circle dan peringatan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AsyncStateBanner
          error={inbox.error}
          onRetry={() => {
            void inbox.reload()
          }}
          label="Gagal memuatkan pemberitahuan."
        />

        {inbox.isLoading && inbox.data.length === 0 ? (
          <Skeleton className="h-40 w-full" />
        ) : inbox.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Tiada pemberitahuan lagi.
          </p>
        ) : (
          <ItemGroup className="gap-3">
            {inbox.data.map((n) => (
              <Item
                key={n.id}
                variant={n.readAt ? "muted" : "outline"}
                className="items-start"
              >
                <ItemMedia variant="icon">
                  <IconBell />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle className="flex flex-wrap items-center gap-2">
                    {n.title}
                    {n.readAt ? null : <Badge variant="default">Baharu</Badge>}
                    {n.acknowledgedAt ? (
                      <Badge variant="outline">Diakui</Badge>
                    ) : null}
                  </ItemTitle>
                  {n.body ? <ItemDescription>{n.body}</ItemDescription> : null}
                  <ItemDescription>{dateTime(n.createdAt)}</ItemDescription>
                </ItemContent>
                <ItemActions className="flex-col items-end gap-1 sm:flex-row sm:items-center">
                  {n.readAt ? null : (
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => {
                        void run(inbox.markRead(n.id), "Ditanda dibaca.")
                      }}
                    >
                      <IconCheck />
                      Tandakan dibaca
                    </Button>
                  )}
                  {/* Diakui BERBEZA daripada dibaca: melihat peringatan dos
                      bukan bermakna dos sudah diberi (docs/05 §6). */}
                  {n.acknowledgedAt ? null : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => {
                        void run(inbox.acknowledge(n.id), "Tindakan diakui.")
                      }}
                    >
                      <IconChecks />
                      Akui
                    </Button>
                  )}
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        )}

        {inbox.hasMore ? (
          <div className="flex justify-center">
            <Button
              variant="outline"
              isDisabled={inbox.isLoading}
              onPress={() => {
                void inbox.loadMore()
              }}
            >
              Muat lagi
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
