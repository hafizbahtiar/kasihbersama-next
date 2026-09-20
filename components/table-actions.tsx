"use client"

import type { ComponentProps } from "react"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { cn } from "@/lib/utils"

type TableActionButtonProps = ComponentProps<typeof Button>

export function TableActionButton({
  className,
  variant = "outline",
  size = "sm",
  ...props
}: TableActionButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn("px-2", className)}
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
