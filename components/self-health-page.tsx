"use client"

import { SelfHealthCard } from "@/components/health/self-health-card"

export function SelfHealthPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl tracking-tight">Kad kecemasan</h1>
        <p className="text-sm text-muted-foreground">
          Maklumat perubatan anda sendiri yang dibaca semasa kecemasan.
        </p>
      </div>
      <SelfHealthCard />
    </div>
  )
}