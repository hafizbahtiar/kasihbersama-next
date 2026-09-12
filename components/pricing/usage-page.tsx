"use client"

import { IconAlertTriangle } from "@tabler/icons-react"

import { BackButton } from "@/components/back-button"
import { PageHeader } from "@/components/care/page-header"
import { UsageAgainstYourLimit } from "@/components/pricing/usage-against-your-limit"
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
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress"
import { useAccountUsage } from "@/hooks/use-account-usage"
import { planDisplayName } from "@/lib/domain/platform"

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function UsageMeter({
  label,
  used,
  cap,
  atCapMessage,
  valueLabel,
}: {
  label: string
  used: number
  cap: number
  atCapMessage?: string
  valueLabel?: string
}) {
  if (cap <= 0) {
    return null
  }
  const atCap = used >= cap
  const percent = Math.min(100, Math.round((used / cap) * 100))

  return (
    <div className="space-y-2">
      <Progress value={percent} className="gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <ProgressLabel>{label}</ProgressLabel>
          <ProgressValue>
            {() => valueLabel ?? `${used} daripada ${cap}`}
          </ProgressValue>
        </div>
      </Progress>
      {atCap && atCapMessage ? (
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <IconAlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          {atCapMessage}
        </p>
      ) : null}
    </div>
  )
}

export function UsagePage() {
  const { usage, isLoading, loadError } = useAccountUsage()

  return (
    <div className="flex flex-col gap-8">
      <BackButton href="/pricing" />
      <PageHeader
        title="Penggunaan anda"
        description="Nombor dari pelayan - sama seperti yang menolak profil atau jemputan baharu apabila had dicapai."
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Memuatkan penggunaan…</p>
      ) : null}
      {loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : null}

      {usage ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">
              Pelan {planDisplayName(usage.plan)}
            </Badge>
            <LinkButton variant="outline" size="sm" href="/pricing">
              Lihat pelan
            </LinkButton>
          </div>

          <UsageAgainstYourLimit usage={usage} />

          {usage.members.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Ahli setiap profil</CardTitle>
                <CardDescription>
                  Ahli aktif dan jemputan belum dijawab - sama seperti semasa
                  menolak jemputan baharu.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {usage.members.map((row) => (
                  <UsageMeter
                    key={row.careProfileId}
                    label={row.displayName}
                    used={row.used}
                    cap={usage.limits.maxMembers}
                    atCapMessage="Jemputan baharu akan ditolak sehingga bilangan ahli di bawah had."
                  />
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Storan fail</CardTitle>
              <CardDescription>
                Jumlah bait dokumen aktif dalam storan awan. Data jagaan dalam
                pangkalan data tidak dikira di sini.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <UsageMeter
                label="Storan awan"
                used={usage.storage.usedBytes}
                cap={usage.limits.maxStorageMb * 1024 * 1024}
                valueLabel={`${formatBytes(usage.storage.usedBytes)} daripada ${usage.limits.maxStorageMb} MB`}
                atCapMessage="Muat naik baharu akan ditolak sehingga storan kosong atau pelan dinaik taraf."
              />
              <p className="text-sm text-muted-foreground">
                Had setiap fail: {usage.limits.maxUploadMb} MB. Had jumlah storan:{" "}
                {usage.limits.maxStorageMb} MB.
              </p>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
