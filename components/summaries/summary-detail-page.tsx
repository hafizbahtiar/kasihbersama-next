"use client"

import { useCallback, useEffect, useState } from "react"
import { IconPrinter, IconSparkles } from "@tabler/icons-react"

import { AsyncStateBanner } from "@/components/care/async-state"
import { BackButton } from "@/components/back-button"
import { useCareProfile } from "@/components/care/care-data-provider"
import { SelectProfileEmpty } from "@/components/care/select-profile-empty"
import { SummarySections } from "@/components/summaries/summary-sections"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getCareRepository } from "@/lib/composition/care-repository"
import { formatDate } from "@/lib/application/care-format"
import type { CareSummary } from "@/lib/domain/care"
import { ApiError, normalizeApiError } from "@/lib/infrastructure/api/errors"

/**
 * One stored summary, at its own URL.
 *
 * A page rather than a sheet because this is the artefact that leaves the app:
 * it has to be linkable, reopenable, and printable. A sheet is a portal over
 * the whole document, so printing one prints the app behind it.
 */
export function SummaryDetailPage({ summaryId }: { summaryId: string }) {
  const { selectedProfile } = useCareProfile()
  const profileId = selectedProfile?.id
  const [summary, setSummary] = useState<CareSummary | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(profileId))
  const [error, setError] = useState<ApiError | null>(null)

  const load = useCallback(async () => {
    if (!profileId) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      setSummary(await getCareRepository().getSummary(profileId, summaryId))
    } catch (cause) {
      setError(normalizeApiError(cause))
      setSummary(null)
    } finally {
      setIsLoading(false)
    }
  }, [profileId, summaryId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  if (!profileId) {
    return <SelectProfileEmpty />
  }

  return (
    <div data-print="document" className="flex flex-col gap-5">
      <div data-print-hide className="flex flex-wrap items-center gap-2">
        <BackButton href="/summaries" />
        <Button
          variant="outline"
          className="ml-auto"
          isDisabled={!summary}
          onPress={() => window.print()}
        >
          <IconPrinter />
          Cetak / simpan PDF
        </Button>
      </div>

      <div data-print-hide>
        <AsyncStateBanner
          error={error}
          onRetry={() => {
            void load()
          }}
          label="Gagal memuatkan ringkasan."
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : !summary ? (
        <p className="text-sm text-muted-foreground">
          Ringkasan tidak dijumpai.
        </p>
      ) : (
        <article className="space-y-5">
          <header className="space-y-1">
            <h1 className="font-heading text-2xl tracking-tight">
              Ringkasan jagaan
            </h1>
            <p className="text-sm text-muted-foreground">
              {selectedProfile.displayName} · {formatDate(summary.periodStart)}{" "}
              – {formatDate(summary.periodEnd)}
            </p>
            <p className="text-sm text-muted-foreground">
              {/* Printed, this line is the provenance a clinician needs: it
                  says where the contents came from and whether a model
                  touched them. */}
              {summary.generator === "assembled" ? (
                "Disusun daripada rekod keluarga. Tiada apa yang ditambah."
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <Badge variant="outline">
                    <IconSparkles />
                    Dijana AI
                  </Badge>
                  Semak sebelum dikongsi.
                </span>
              )}
            </p>
          </header>

          <SummarySections content={summary.content} />
        </article>
      )}
    </div>
  )
}
