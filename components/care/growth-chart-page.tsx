"use client"

import { useState } from "react"

import { AsyncStateBanner } from "@/components/care/async-state"
import { GrowthChartWidget } from "@/components/care/growth-chart-widget"
import { PageHeader } from "@/components/care/page-header"
import { SelectProfileEmpty } from "@/components/care/select-profile-empty"
import { useCareProfile } from "@/components/care/care-data-provider"
import { usePlatform } from "@/components/platform/platform-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { LinkButton } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useGrowthChart } from "@/hooks/use-growth-chart"
import { formatDate } from "@/lib/application/care-format"
import {
  GROWTH_INDICATORS,
  GROWTH_INDICATOR_LABELS,
  GROWTH_REQUIREMENT_MESSAGES,
  type GrowthIndicator,
  type GrowthRequirement,
} from "@/lib/domain/growth"

export function GrowthChartPage() {
  const { selectedProfile } = useCareProfile()
  const { isFeatureEnabled } = usePlatform()
  const [indicator, setIndicator] =
    useState<GrowthIndicator>("weight_for_age")
  const { chart, notReady, isLoading, error, reload } = useGrowthChart(
    selectedProfile?.id,
    indicator
  )

  if (!selectedProfile) {
    return <SelectProfileEmpty />
  }

  // Reachable by typing the URL even while the nav entry is hidden. The
  // endpoint answers 404 when the feature is off, which is indistinguishable
  // from a missing record at the transport layer - so say plainly what is
  // happening rather than showing "Rekod tidak dijumpai".
  if (!isFeatureEnabled("growth_chart")) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Carta tumbesaran"
          description="Belum tersedia."
        />
        <Alert>
          <AlertTitle>Carta tumbesaran belum dibuka</AlertTitle>
          <AlertDescription>
            Ciri ini menunggu data rujukan WHO. Buku imunisasi dan senarai
            semak perkembangan berfungsi seperti biasa.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const outOfRange = chart?.points.filter((point) => point.z === null) ?? []
  const corrected = chart?.points.some((point) => point.usesCorrectedAge)

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Carta tumbesaran"
        description={`Ukuran ${selectedProfile.displayName} berbanding julat rujukan WHO.`}
        actions={
          <Select
            className="w-full sm:w-64"
            value={indicator}
            onChange={(key) =>
              setIndicator(String(key ?? "weight_for_age") as GrowthIndicator)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GROWTH_INDICATORS.map((item) => (
                <SelectItem key={item} id={item}>
                  {GROWTH_INDICATOR_LABELS[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {notReady ? (
        // Not an error state: this chart cannot exist yet, and the fix is a
        // field on the profile rather than a retry.
        <Alert>
          <AlertTitle>Carta belum boleh dilukis</AlertTitle>
          <AlertDescription className="space-y-2">
            <ul className="list-disc space-y-1 pl-4">
              {notReady.missing.map((item) => (
                <li key={item}>
                  {GROWTH_REQUIREMENT_MESSAGES[item as GrowthRequirement] ??
                    item}
                </li>
              ))}
            </ul>
            <LinkButton
              href={`/care-profiles/${selectedProfile.id}`}
              variant="outline"
              size="sm"
            >
              Kemas kini profil
            </LinkButton>
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <AsyncStateBanner error={error} onRetry={() => void reload()} />
      ) : null}

      {isLoading ? <Skeleton className="aspect-[16/10] w-full rounded-xl" /> : null}

      {chart && !isLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>{GROWTH_INDICATOR_LABELS[chart.indicator]}</CardTitle>
            <CardDescription>
              Garis putus ialah julat rujukan (−3, −2, +2, +3 SD); garis tengah
              ialah median. Paksi mendatar dalam bulan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {chart.bands.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Tiada julat rujukan untuk umur ini. Standard WHO meliputi 0–5
                tahun sahaja.
              </p>
            ) : (
              <GrowthChartWidget chart={chart} />
            )}

            {corrected ? (
              <p className="text-sm text-muted-foreground">
                Diplot pada umur terkoreksi kerana kelahiran pramatang.
              </p>
            ) : null}

            {outOfRange.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                {outOfRange.length} ukuran di luar julat rujukan dan tidak
                diberi skor:{" "}
                {outOfRange
                  .map((point) => formatDate(point.measuredAt))
                  .join(", ")}
                .
              </p>
            ) : null}

            {/*
              No interpretation here, and none is coming. A z-score below -2 SD
              has a clinical name in the WHO documentation, and putting that
              word next to a parent's baby is a diagnosis this product does not
              make. The bands are shown so the chart speaks for itself; any
              wording stronger than this needs a clinician's sign-off.
            */}
            <Alert>
              <AlertTitle>Carta ini bukan diagnosis</AlertTitle>
              <AlertDescription>
                Julat rujukan menunjukkan kedudukan ukuran berbanding populasi
                rujukan WHO. Ia tidak mentafsir kesihatan anak anda. Bincang
                dengan klinik jika anda ada kemusykilan.
              </AlertDescription>
            </Alert>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {chart.points.length} ukuran direkod
              </Badge>
              <Badge variant="secondary">Unit: {chart.unit}</Badge>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
