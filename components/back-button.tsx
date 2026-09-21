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

    // Kembali bermakna halaman SEBELUMNYA, bukan satu laluan tetap ke atas: pengguna
    // yang datang dari senarai orang mahu balik ke senarai itu, bukan ke tab lain.
    // Next menyimpan indeks history pada state; 0 bermakna tab ini dibuka terus ke
    // sini, jadi tiada "belakang" wujud dan `href` menjadi jalan naik.
    const entry = window.history.state as { idx?: number } | null
    if ((entry?.idx ?? 0) > 0) {
      router.back()
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
          : "w-fit gap-1 px-2 text-muted-foreground hover:text-foreground",
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
