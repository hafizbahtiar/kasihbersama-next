"use client"

import type { ComponentProps } from "react"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { cn } from "@/lib/utils"

type TableActionButtonProps = ComponentProps<typeof Button> & {
  /**
   * `danger` untuk tindakan yang membuang sesuatu.
   *
   * Merah TEKS dan bukan butang merah penuh: dalam satu ButtonGroup, satu butang
   * padu merah menarik mata lebih daripada tindakan biasa di sebelahnya, dan
   * itulah butang yang paling kurang patut ditekan secara tidak sengaja.
   *
   * Warna ialah amaran, bukan pengesahan - setiap tindakan `danger` masih
   * membuka satu `ConfirmDialog` dengan `variant="destructive"`.
   */
  tone?: "default" | "danger"
}

export function TableActionButton({
  className,
  variant = "outline",
  size = "sm",
  tone = "default",
  ...props
}: TableActionButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "px-2",
        tone === "danger" &&
        "text-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive/40 active:bg-destructive/15",
        className
      )}
      {...props}
    />
  )
}

export function TableActions({
  className,
  ...props
}: ComponentProps<typeof ButtonGroup>) {
  return (
    <ButtonGroup className={cn("ml-auto justify-end", className)} {...props} />
  )
}
