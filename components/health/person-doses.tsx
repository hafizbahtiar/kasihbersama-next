"use client"

import { useState } from "react"
import { IconCheck, IconPill, IconX } from "@tabler/icons-react"
import { toast } from "sonner"

import { StatusChip, type StatusTone } from "@/components/status-chip"
import { AsyncStateBanner } from "@/components/shared/async-state"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { usePersonDoses } from "@/hooks/use-person-doses"
import { useDisplayFormat } from "@/lib/application/display-preferences"
import { getHealthRepository } from "@/lib/composition/health-repository"
import {
  DOSE_STATUS_LABELS,
  todayISO,
  type DoseStatus,
  type HealthDose,
} from "@/lib/domain/health"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"

const DOSE_TONE: Record<DoseStatus, StatusTone> = {
  pending: "neutral",
  taken: "positive",
  missed: "critical",
  skipped: "attention",
  refused: "attention",
}

/**
 * Dos untuk satu hari - bukan jadual DataTable.
 *
 * Ini skrin yang dibuka sambil berdiri di dapur memegang sebiji pil. Ia senarai
 * masa yang besar dan dua butang, bukan jadual yang boleh diisih dan ditapis.
 */
export function PersonDoses({
  circleId,
  personId,
  canWrite,
}: {
  circleId: string
  personId: string
  canWrite: boolean
}) {
  const [date, setDate] = useState(todayISO)
  const doses = usePersonDoses(circleId, personId, date)
  const { time } = useDisplayFormat()
  const [busy, setBusy] = useState<string | null>(null)

  async function mark(dose: HealthDose, status: DoseStatus) {
    setBusy(dose.scheduleId + dose.scheduledAt)
    try {
      await getHealthRepository().recordDose(circleId, personId, {
        scheduleId: dose.scheduleId,
        scheduledAt: dose.scheduledAt,
        status,
      })
      toast.success(DOSE_STATUS_LABELS[status] + " direkodkan.")
      await doses.reload()
    } catch (cause) {
      toast.error(
        isApiError(cause) ? messageForApiError(cause) : "Tindakan gagal."
      )
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AsyncStateBanner
        error={doses.error}
        onRetry={() => {
          void doses.reload()
        }}
        label="Gagal memuatkan dos."
      />

      <Field className="max-w-xs">
        <FieldLabel htmlFor="dose-date">Hari</FieldLabel>
        <Input
          id="dose-date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value || todayISO())}
        />
      </Field>

      {doses.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : doses.data.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconPill />
            </EmptyMedia>
            <EmptyTitle>Tiada dos pada hari ini</EmptyTitle>
            <EmptyDescription>
              Dos datang daripada jadual dalam tab Ubat. Tambah jadual di sana
              dan ia muncul di sini.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="divide-y rounded-xl border">
          {doses.data.map((dose) => {
            const key = dose.scheduleId + dose.scheduledAt
            return (
              <li
                key={key}
                className="flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap"
              >
                <span className="w-16 shrink-0 font-heading text-lg tabular-nums">
                  {dose.timeOfDay}
                </span>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="font-medium">
                    {dose.name}
                    {dose.strength ? (
                      <span className="text-muted-foreground">
                        {" "}
                        {dose.strength}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {dose.doseAmount} {dose.doseUnit}
                    {dose.instructions ? ` - ${dose.instructions}` : ""}
                  </p>
                </div>
                {dose.status ? (
                  <div className="flex items-center gap-2">
                    <StatusChip
                      tone={DOSE_TONE[dose.status]}
                      label={DOSE_STATUS_LABELS[dose.status]}
                    />
                    {dose.recordedAt ? (
                      <span className="text-xs text-muted-foreground">
                        {time(dose.recordedAt)}
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <StatusChip tone="neutral" label="Belum ditanda" />
                )}
                {canWrite ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      isDisabled={busy === key}
                      onPress={() => {
                        void mark(dose, "taken")
                      }}
                    >
                      <IconCheck />
                      Dah makan
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      isDisabled={busy === key}
                      onPress={() => {
                        void mark(dose, "skipped")
                      }}
                    >
                      <IconX />
                      Langkau
                    </Button>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
