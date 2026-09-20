"use client"

import { useState } from "react"
import { IconBell, IconCheck } from "@tabler/icons-react"

import { usePlatform } from "@/components/platform/platform-provider"
import { Button, LinkButton } from "@/components/ui/button"
import {
  Popover,
  PopoverTrigger,
  PopoverTitle,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useNotifications } from "@/hooks/use-notifications"
import { useDisplayFormat } from "@/lib/application/display-preferences"
import { messageForApiError } from "@/lib/infrastructure/api/errors"

/** Peti masuk penuh ada di /notifications; ini hanya tingkap intai. */
const PREVIEW_COUNT = 7

export function NotificationPopover() {
  const [isOpen, setIsOpen] = useState(false)
  const { unreadNotifications } = usePlatform()

  return (
    <PopoverTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={
          unreadNotifications > 0
            ? `Pemberitahuan: ${unreadNotifications} belum dibaca`
            : "Pemberitahuan"
        }
        className="relative"
      >
        <IconBell />
        {unreadNotifications > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] leading-4 font-medium text-primary-foreground">
            {unreadNotifications > 9 ? "9+" : unreadNotifications}
          </span>
        ) : null}
      </Button>

      {/* Kandungan hanya dipasang bila dibuka, jadi tiada permintaan peti masuk
          pada setiap halaman yang merender header ini. */}
      <Popover className="w-80 p-0">
        <NotificationPreview onNavigate={() => setIsOpen(false)} />
      </Popover>
    </PopoverTrigger>
  )
}

function NotificationPreview({ onNavigate }: { onNavigate: () => void }) {
  const inbox = useNotifications()
  const { refresh: refreshBootstrap } = usePlatform()
  const { dateTime } = useDisplayFormat()
  const rows = inbox.data.slice(0, PREVIEW_COUNT)

  return (
    <div className="flex flex-col">
      <div className="px-3 pt-3 pb-2">
        <PopoverTitle>Pemberitahuan</PopoverTitle>
      </div>
      <Separator />

      <div className="max-h-80 overflow-y-auto">
        {inbox.isLoading && rows.length === 0 ? (
          <div className="space-y-2 p-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : inbox.error ? (
          <p className="p-3 text-sm text-destructive">
            {messageForApiError(inbox.error)}
          </p>
        ) : rows.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">
            Tiada pemberitahuan.
          </p>
        ) : (
          <ul className="divide-y">
            {rows.map((n) => (
              <li key={n.id} className="flex items-start gap-2 p-3">
                <span
                  aria-hidden="true"
                  className={
                    n.readAt
                      ? "mt-1.5 size-2 shrink-0 rounded-full bg-transparent"
                      : "mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                  }
                />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-sm leading-snug font-medium">{n.title}</p>
                  {n.body ? (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {n.body}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {dateTime(n.createdAt)}
                  </p>
                </div>
                {n.readAt ? null : (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Tandakan dibaca: ${n.title}`}
                    onPress={() => {
                      void inbox.markRead(n.id).then(() => refreshBootstrap())
                    }}
                  >
                    <IconCheck />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Separator />
      <div className="p-2">
        <LinkButton
          href="/notifications"
          variant="ghost"
          className="w-full justify-center"
          onPress={onNavigate}
        >
          Lihat semua pemberitahuan
        </LinkButton>
      </div>
    </div>
  )
}
