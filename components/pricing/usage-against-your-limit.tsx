"use client"

import { IconAlertTriangle } from "@tabler/icons-react"

import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import type { CareProfile } from "@/lib/domain/care"
import type { PlatformLimits } from "@/lib/domain/platform"

/**
 * Your own usage against the limit the server is enforcing right now.
 *
 * This is the one thing a pricing page normally cannot say. Every other
 * pricing page describes a hypothetical account; this one reads
 * `MAX_PROFILES_FREE` from `/bootstrap` - the same value `checkProfileQuota`
 * uses to refuse a create - and shows how close you are to it. It is also the
 * honest answer to the question the page asks in its heading.
 */
export function UsageAgainstYourLimit({
  limits,
  profiles,
}: {
  limits: PlatformLimits
  profiles: CareProfile[]
}) {
  const used = profiles.length
  const cap = limits.maxProfilesFree
  if (cap <= 0) {
    // 0 means "unlimited" server-side; there is no bar to draw.
    return null
  }
  const atCap = used >= cap
  const percent = Math.min(100, Math.round((used / cap) * 100))

  return (
    <Card>
      <CardContent className="space-y-2">
        <Progress value={percent} className="gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <ProgressLabel>Profil jagaan anda</ProgressLabel>
            {/* The raw count, not the percentage: "1 of 1" is what a person
                acts on; "100%" is what a dashboard says. */}
            <ProgressValue>{() => `${used} daripada ${cap}`}</ProgressValue>
          </div>
        </Progress>
        {atCap ? (
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <IconAlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            Anda sudah mencapai had pelan Percuma. Mencipta profil baharu akan
            ditolak sehingga pelan berbayar dibuka.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
