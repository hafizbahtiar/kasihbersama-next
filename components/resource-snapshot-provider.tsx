"use client"

import { createContext, useContext, type ReactNode } from "react"

import type { ResourceSnapshot } from "@/lib/application/resource-snapshot"
import type { ResourceRecord } from "@/lib/domain/resource"

const ResourceSnapshotContext = createContext<ResourceSnapshot | null>(null)

export function ResourceSnapshotProvider({
  snapshot,
  children,
}: {
  snapshot: ResourceSnapshot | null
  children: ReactNode
}) {
  return (
    <ResourceSnapshotContext.Provider value={snapshot}>
      {children}
    </ResourceSnapshotContext.Provider>
  )
}

export function useResourceSnapshot() {
  return useContext(ResourceSnapshotContext)
}

export function useNotificationPreview(): ResourceRecord[] {
  return useResourceSnapshot()?.notifications ?? []
}
