"use client"

import { useCallback, useEffect, useState } from "react"
import { IconAlertTriangle, IconPrinter } from "@tabler/icons-react"

import { AsyncStateBanner } from "@/components/care/async-state"
import { useCareProfile } from "@/components/care/care-data-provider"
import { PageHeader } from "@/components/care/page-header"
import { SelectProfileEmpty } from "@/components/care/select-profile-empty"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getCareRepository } from "@/lib/composition/care-repository"
import { formatDate } from "@/lib/application/care-format"
import type { EmergencyCard } from "@/lib/domain/care"
import { ApiError, normalizeApiError } from "@/lib/infrastructure/api/errors"

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) {
    return null
  }
  return (
    <div className="space-y-0.5">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="text-base">{value}</p>
    </div>
  )
}

/**
 * The break-glass card.
 *
 * Laid out for someone reading it under pressure, not browsing it: the two
 * things that change treatment - allergies and blood type - come first and
 * largest, and everything is one screen with no tabs to find.
 *
 * Reading this is recorded in the profile's audit trail by the backend. The
 * page says so, because someone handed emergency access should know their
 * viewing is visible to the family.
 */
export function EmergencyCardPage() {
  const { selectedProfile } = useCareProfile()
  const profileId = selectedProfile?.id
  const [card, setCard] = useState<EmergencyCard | null>(null)
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
      setCard(await getCareRepository().getEmergencyCard(profileId))
    } catch (cause) {
      setError(normalizeApiError(cause))
      setCard(null)
    } finally {
      setIsLoading(false)
    }
  }, [profileId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  if (!profileId) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Kad kecemasan" />
        <SelectProfileEmpty />
      </div>
    )
  }

  return (
    <div data-print="document" className="flex flex-col gap-5">
      <div data-print-hide>
        <PageHeader
          title="Kad kecemasan"
          description="Maklumat kritikal untuk ditunjukkan kepada doktor atau paramedik."
          actions={
            <Button
              variant="outline"
              isDisabled={!card}
              onPress={() => window.print()}
            >
              <IconPrinter />
              Cetak
            </Button>
          }
        />
      </div>

      <div data-print-hide>
        <AsyncStateBanner
          error={error}
          onRetry={() => {
            void load()
          }}
          label="Gagal memuatkan kad kecemasan."
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-80 w-full" />
      ) : !card ? (
        <p className="text-sm text-muted-foreground">
          Kad kecemasan tidak tersedia untuk profil ini.
        </p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{card.displayName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Allergies first and loudest: it is the one field on this card
                  that changes what a clinician does in the next minute. */}
              <div className="rounded-lg bg-destructive/10 p-4 ring-1 ring-destructive/30">
                <p className="text-xs tracking-wide text-destructive uppercase">
                  Alahan
                </p>
                <p className="mt-1 text-lg font-medium">
                  {card.allergySummary || "Tiada direkodkan"}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Row label="Jenis darah" value={card.bloodType} />
                <Row
                  label="Tarikh lahir"
                  value={
                    card.dateOfBirth ? formatDate(card.dateOfBirth) : undefined
                  }
                />
                <Row label="Nama penuh" value={card.legalName} />
                <Row label="Jantina" value={card.gender} />
              </div>

              <Row label="Keadaan kesihatan" value={card.conditionSummary} />

              <div className="grid gap-4 sm:grid-cols-2">
                <Row label="Klinik utama" value={card.primaryClinic} />
                <Row label="Doktor utama" value={card.primaryDoctor} />
              </div>

              {card.emergencyNote ? (
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-xs tracking-wide text-muted-foreground uppercase">
                    Nota kecemasan
                  </p>
                  <p className="mt-1 text-base">{card.emergencyNote}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div data-print-hide>
            <Alert>
              <IconAlertTriangle />
              <AlertTitle>Bacaan direkodkan</AlertTitle>
              <AlertDescription>
                Setiap kali kad ini dibuka, ia dicatat dalam sejarah profil
                bersama nama anda.
              </AlertDescription>
            </Alert>
          </div>
        </>
      )}
    </div>
  )
}
