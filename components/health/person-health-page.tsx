"use client"

import { BackButton } from "@/components/back-button"
import { PersonHealth } from "@/components/health/person-health"
import { usePlatform } from "@/components/platform/platform-provider"

/** Permission yang skrin ini sembunyikan di belakangnya (docs/04 §8). */
const PERM_WRITE = "health.condition.create"

export function PersonHealthPage({
  circleId,
  personId,
  backHref = `/circles/${circleId}`,
}: {
  circleId: string
  personId: string
  /** Laluan naik bila tab dibuka terus ke URL ini dan tiada sejarah untuk dikembali. */
  backHref?: string
}) {
  const { activeCircle, can } = usePlatform()

  // Kebenaran diselesaikan untuk circle AKTIF sahaja, jadi skrin ini hanya boleh
  // mempercayainya bila circle yang dipaparkan ialah circle aktif. Di luar itu ia
  // baca sahaja, dan pelayan kekal menjadi pihak yang memutuskan.
  const isActive = activeCircle?.id === circleId
  const canWrite = isActive && can(PERM_WRITE)
  const canWriteCare = isActive && can("care.need.create")
  const canWriteLog = isActive && can("care.log.create")
  const canModerateLog = isActive && can("care.log.manage")
  const canWriteShift = isActive && can("care.shift.create")
  const canWriteRota = isActive && can("care.rota.create")
  const canUpdatePerson = isActive && can("core.person.update")

  return (
    <div className="flex flex-col gap-5">
      <BackButton href={backHref} />

      <PersonHealth
        circleId={circleId}
        personId={personId}
        canWrite={canWrite}
        canWriteCare={canWriteCare}
        canWriteLog={canWriteLog}
        canModerateLog={canModerateLog}
        canWriteShift={canWriteShift}
        canWriteRota={canWriteRota}
        canUpdatePerson={canUpdatePerson}
      />
    </div>
  )
}
