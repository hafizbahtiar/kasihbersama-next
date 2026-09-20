"use client"

import { IconInfoCircle } from "@tabler/icons-react"

import { usePlatform } from "@/components/platform/platform-provider"
import { AsyncStateBanner } from "@/components/shared/async-state"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { usePlanUsage } from "@/hooks/use-plan-usage"
import type { PlanUsage } from "@/lib/domain/account"

/** 262144000 bait is a number nobody can size; it is shown in MB or GB. */
function formatBytes(bytes: number) {
  const mb = bytes / (1024 * 1024)
  if (mb < 1) {
    return `${bytes} bait`
  }
  if (mb < 1024) {
    return `${mb % 1 === 0 ? mb : mb.toFixed(1)} MB`
  }
  return `${(mb / 1024).toFixed(1)} GB`
}

/**
 * One line of the usage list.
 *
 * `limit` absent means the number does not apply to this account (no circle chosen);
 * `null` means there is no ceiling. They are rendered differently on purpose - a
 * missing ceiling and an inapplicable one are not the same fact.
 */
function UsageRow({
  label,
  used,
  limit,
}: {
  label: string
  used: string
  limit?: string | null
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b py-2 last:border-b-0">
      <span className="text-sm">{label}</span>
      <span className="font-medium tabular-nums">
        {limit === undefined ? used : `${used} / ${limit ?? "tanpa had"}`}
      </span>
    </div>
  )
}

function UsageCard({ data }: { data: PlanUsage }) {
  const { limits, usage } = data

  return (
    <CardContent className="space-y-4">
      {/* Plan notice, driven by the plan key the SERVER applied - not by a hardcoded
          assumption. When paid plans exist, this branch is the only thing that changes. */}
      {data.plan === "free" ? (
        <Alert>
          <IconInfoCircle />
          <AlertTitle>Anda pada plan percuma</AlertTitle>
          <AlertDescription>
            Buat masa ini setiap akaun mendapat plan percuma yang sama. Plan premium
            akan datang - ciri dan hadnya akan muncul di sini bila ia bermula.
          </AlertDescription>
        </Alert>
      ) : null}

      <div>
        <UsageRow
          label="Circle dimiliki"
          used={String(usage.ownedCircles)}
          limit={
            limits.ownedCircles === null ? null : String(limits.ownedCircles)
          }
        />
        {usage.circle ? (
          <>
            <UsageRow
              label="Orang dalam circle ini"
              used={String(usage.circle.personCount)}
              limit={
                limits.personsPerCircle === undefined
                  ? undefined
                  : limits.personsPerCircle === null
                    ? null
                    : String(limits.personsPerCircle)
              }
            />
            <UsageRow
              label="Ahli aktif dalam circle ini"
              used={String(usage.circle.memberCount)}
              limit={
                limits.membersPerCircle === undefined
                  ? undefined
                  : limits.membersPerCircle === null
                    ? null
                    : String(limits.membersPerCircle)
              }
            />
            <UsageRow
              label="Storan circle ini"
              used={formatBytes(usage.circle.storageBytes)}
              limit={
                limits.storageBytesPerCircle === undefined
                  ? undefined
                  : limits.storageBytesPerCircle === null
                    ? null
                    : formatBytes(limits.storageBytesPerCircle)
              }
            />
          </>
        ) : (
          <p className="pt-2 text-sm text-muted-foreground">
            Pilih circle aktif untuk melihat penggunaan orang, ahli dan storannya.
          </p>
        )}
      </div>
    </CardContent>
  )
}

/**
 * "Penggunaan" - what the plan allows and what has been used.
 *
 * The numbers come from the server, which is the only thing that counts. This card
 * explains a refusal the user has already met - `billing.limit.reached` tells them to
 * look here - so it shows the ceilings as they are enforced, not as the client wishes.
 */
export function UsageSection() {
  const { activeCircle } = usePlatform()
  const usage = usePlanUsage(activeCircle?.id)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Penggunaan</CardTitle>
        <CardDescription>
          Had plan anda, dan sejauh mana ia telah digunakan.
        </CardDescription>
      </CardHeader>
      <AsyncStateBanner
        error={usage.error}
        onRetry={() => {
          void usage.reload()
        }}
        label="Gagal memuatkan penggunaan."
      />
      {usage.isLoading ? (
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      ) : usage.data ? (
        <UsageCard data={usage.data} />
      ) : null}
    </Card>
  )
}
