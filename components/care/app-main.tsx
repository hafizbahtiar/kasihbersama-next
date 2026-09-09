"use client"

import type { ReactNode } from "react"

import { AsyncStateBanner } from "@/components/care/async-state"
import { PageLoadingState } from "@/components/care/page-loading-state"
import { useCareData } from "@/components/care/care-data-provider"
import { Spinner } from "@/components/ui/spinner"

export function AppMain({ children }: { children: ReactNode }) {
  const { isReady, isRefreshing, loadError, refresh } = useCareData()

  if (!isReady) {
    return (
      <div
        className="flex flex-1 flex-col gap-5 p-4 sm:p-6"
        aria-busy="true"
        aria-live="polite"
      >
        <PageLoadingState />
      </div>
    )
  }

  return (
    <div
      className="flex flex-1 flex-col gap-5 p-4 sm:p-6"
      aria-busy={isRefreshing}
    >
      <AsyncStateBanner
        error={loadError}
        onRetry={() => {
          void refresh()
        }}
        label="Gagal memuatkan data jagaan."
      />
      {isRefreshing ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner />
          Menyegar semula...
        </div>
      ) : null}
      {children}
    </div>
  )
}
