"use client"

import { IconAlertTriangle } from "@tabler/icons-react"

import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import type { AccountUsage } from "@/lib/domain/account"
import { planDisplayName } from "@/lib/domain/platform"

/**
 * Your usage against the limits the server enforces - from GET /me/usage,
 * not a count of whatever profile list the client happens to hold.
 */
export function UsageAgainstYourLimit({
  usage,
}: {
  usage: AccountUsage | null
}) {
  if (!usage) {
    return null
  }
  const used = usage.profiles.used
  const cap = usage.limits.maxProfiles
  if (cap <= 0) {
    return null
  }
  const atCap = used >= cap
  const percent = Math.min(100, Math.round((used / cap) * 100))
  const planName = planDisplayName(usage.plan)

  return (
    <Card>
      <CardContent className="space-y-2">
        <Progress value={percent} className="gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <ProgressLabel>Profil jagaan anda</ProgressLabel>
            <ProgressValue>{() => `${used} daripada ${cap}`}</ProgressValue>
          </div>
        </Progress>
        {atCap ? (
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <IconAlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            Anda sudah mencapai had pelan {planName}. Mencipta profil baharu
            akan ditolak sehingga penggunaan kembali di bawah had.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
