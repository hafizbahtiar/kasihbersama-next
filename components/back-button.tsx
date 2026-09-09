"use client"

import { IconChevronLeft } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import type { ComponentProps, ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type BackButtonProps = Omit<
  ComponentProps<typeof Button>,
  "onPress" | "children"
> & {
  href?: string
  onPress?: () => void
  children?: ReactNode
  appearance?: "nav" | "action"
}

export function BackButton({
  href,
  onPress,
  children = "Kembali",
  appearance = "nav",
  variant,
  size,
  className,
  ...props
}: BackButtonProps) {
  const router = useRouter()
  const isAction = appearance === "action"

  function go() {
    if (onPress) {
      onPress()
      return
    }

    if (href) {
      router.push(href)
      return
    }

    router.back()
  }

  return (
    <Button
      variant={variant ?? (isAction ? "outline" : "ghost")}
      size={size ?? (isAction ? "default" : "sm")}
      className={cn(
        isAction
          ? undefined
          : "h-8 w-fit gap-1 px-2 text-muted-foreground hover:text-foreground",
        className
      )}
      onPress={go}
      {...props}
    >
      {isAction ? null : <IconChevronLeft data-icon="inline-start" />}
      {children}
    </Button>
  )
}
