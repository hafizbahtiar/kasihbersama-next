"use client"

import type { ReactNode } from "react"

export function ApiFieldGapNotice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
      {children}
    </p>
  )
}
