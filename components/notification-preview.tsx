"use client"

import { IconBell } from "@tabler/icons-react"

import { Button, LinkButton } from "@/components/ui/button"
import {
  Popover,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"

export function NotificationPreview() {
  return (
    <PopoverTrigger>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Notifikasi"
        className="relative"
      >
        <IconBell />
      </Button>
      <Popover className="w-80 p-0" placement="bottom end">
        <PopoverHeader className="px-3 pt-3 pb-2">
          <PopoverTitle>Peringatan</PopoverTitle>
          <PopoverDescription>
            Tiada peti masuk - urus keutamaan push/e-mel di tetapan.
          </PopoverDescription>
        </PopoverHeader>
        <div className="p-3 pt-0">
          <LinkButton className="w-full" href="/notifications">
            Lihat keutamaan
          </LinkButton>
        </div>
      </Popover>
    </PopoverTrigger>
  )
}
