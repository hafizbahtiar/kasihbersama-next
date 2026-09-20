"use client"

import { useState } from "react"
import { IconChevronDown, IconPlus, IconUsersGroup } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { usePlatform } from "@/components/platform/platform-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CIRCLE_TYPE_LABELS, roleLabel } from "@/lib/domain/circle"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"

/**
 * The active circle, and the way to change it.
 *
 * A person can belong to several circles - one of their own plus any they were
 * invited to - and everything below this line is scoped to the active one. So
 * the switcher sits above the navigation, not on a page inside it: which circle
 * you are in is not a page, it is the frame every page renders in.
 *
 * Switching is a SESSION change (`POST /auth/switch-circle`), so the provider
 * re-reads bootstrap afterwards - the permission set belongs to the new circle.
 */
export function CircleSwitcher() {
  const router = useRouter()
  const { circles, activeCircle, switchCircle, canCreateCircle } = usePlatform()
  const [isSwitching, setIsSwitching] = useState(false)

  async function choose(circleId: string) {
    if (circleId === activeCircle?.id) {
      return
    }
    setIsSwitching(true)
    try {
      await switchCircle(circleId)
      toast.success("Circle aktif ditukar.")
    } catch (cause) {
      toast.error(
        isApiError(cause) ? messageForApiError(cause) : "Gagal menukar circle."
      )
    } finally {
      setIsSwitching(false)
    }
  }

  return (
    <DropdownMenuTrigger>
      <Button
        variant="ghost"
        isDisabled={isSwitching}
        aria-label={
          activeCircle
            ? `Circle aktif: ${activeCircle.name}. Tukar circle.`
            : "Pilih circle"
        }
        className="h-auto w-full justify-start gap-2 px-2 py-1.5 text-left font-normal"
      >
        <span className="grid size-6 shrink-0 place-items-center rounded-md bg-muted">
          <IconUsersGroup className="size-4" />
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-medium">
            {activeCircle?.name ?? "Tiada circle aktif"}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {activeCircle
              ? roleLabel(activeCircle.roleKey)
              : circles.length > 0
                ? "Pilih satu"
                : "Cipta atau sertai"}
          </span>
        </span>
        <IconChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
      </Button>

      <DropdownMenu placement="bottom start" className="w-64">
        <DropdownMenuLabel>Circle anda</DropdownMenuLabel>
        {circles.map((circle) => (
          <DropdownMenuItem
            key={circle.id}
            id={circle.id}
            onAction={() => {
              void choose(circle.id)
            }}
          >
            <span className="flex min-w-0 flex-col">
              <span className="truncate">{circle.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {CIRCLE_TYPE_LABELS[circle.type] ?? circle.type} ·{" "}
                {roleLabel(circle.roleKey)}
                {circle.id === activeCircle?.id ? " · aktif" : ""}
              </span>
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem id="all" onAction={() => router.push("/circles")}>
          {canCreateCircle ? (
            <>
              <IconPlus />
              Semua circle &amp; cipta baharu
            </>
          ) : (
            "Semua circle"
          )}
        </DropdownMenuItem>
      </DropdownMenu>
    </DropdownMenuTrigger>
  )
}
