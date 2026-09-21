"use client"

import { IconArrowLeft } from "@tabler/icons-react"

import { PersonHealth } from "@/components/health/person-health"
import { usePlatform } from "@/components/platform/platform-provider"
import { LinkButton } from "@/components/ui/button"

/** Permission yang skrin ini sembunyikan di belakangnya (docs/04 §8). */
const PERM_WRITE = "health.condition.create"

export function PersonHealthPage({
  circleId,
  personId,
}: {
  circleId: string
  personId: string
}) {
  const { activeCircle, can } = usePlatform()

  // Kebenaran diselesaikan untuk circle AKTIF sahaja, jadi skrin ini hanya boleh
  // mempercayainya bila circle yang dipaparkan ialah circle aktif. Di luar itu ia
  // baca sahaja, dan pelayan kekal menjadi pihak yang memutuskan.
  const canWrite = activeCircle?.id === circleId && can(PERM_WRITE)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl tracking-tight">
            Rekod kesihatan
          </h1>
          <p className="text-sm text-muted-foreground">
            Kad kecemasan, keadaan dan alahan.
          </p>
        </div>
        <LinkButton href={`/circles/${circleId}`} variant="outline" size="sm">
          <IconArrowLeft />
          Kembali ke circle
        </LinkButton>
      </div>

      <PersonHealth
        circleId={circleId}
        personId={personId}
        canWrite={canWrite}
      />
    </div>
  )
}
