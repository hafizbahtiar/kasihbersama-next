"use client"

import type { FormEvent, ReactNode } from "react"
import { useRouter } from "next/navigation"

export function AuthRedirectForm({
  children,
  className,
  href = "/home",
}: {
  children: ReactNode
  className?: string
  href?: string
}) {
  const router = useRouter()

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    router.push(href)
  }

  return (
    <form className={className} onSubmit={onSubmit}>
      {children}
    </form>
  )
}
