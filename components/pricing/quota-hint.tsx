"use client"

import { IconAlertTriangle, IconInfoCircle } from "@tabler/icons-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { LinkButton } from "@/components/ui/button"
import { useAccountUsage } from "@/hooks/use-account-usage"

/**
 * A limit warning where the action happens, rather than only on /pricing.
 *
 * Someone about to exceed a cap used to find out when they pressed save: the
 * server refused, and the refusal was the first mention of a limit. This says
 * it before the form is filled in.
 *
 * Thresholds are by *remaining*, not by percentage. The free profile cap is 1,
 * where a percentage is meaningless - 0 of 1 is "0%" and 1 of 1 is "100%", and
 * there is no middle for "getting close" to describe. One slot left is the
 * warning; none left is a different message with a different next action.
 */
export function QuotaHint({
  kind,
  profileId,
}: {
  kind: "profiles" | "members"
  /** Required for members: the cap is per care profile. */
  profileId?: string
}) {
  const { usage } = useAccountUsage()

  if (!usage) {
    // No usage loaded is not the same as no limit. Saying nothing beats
    // guessing at a cap and being wrong in either direction.
    return null
  }

  const { used, cap } =
    kind === "profiles"
      ? { used: usage.profiles.used, cap: usage.limits.maxProfiles }
      : {
          used:
            usage.members.find((item) => item.careProfileId === profileId)
              ?.used ?? 0,
          cap: usage.limits.maxMembers,
        }

  // A cap of zero or less means unlimited in this API, not "nothing allowed".
  if (cap <= 0) {
    return null
  }

  const remaining = cap - used
  if (remaining > 1) {
    return null
  }

  const noun = kind === "profiles" ? "profil jagaan" : "ahli"

  if (remaining <= 0) {
    return (
      <Alert variant="destructive">
        <IconAlertTriangle />
        <AlertTitle>Had {noun} sudah penuh</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            Anda menggunakan {used} daripada {cap} {noun} pada pelan semasa.
            Tindakan ini akan ditolak.
          </p>
          <LinkButton href="/pricing" variant="outline" size="sm">
            Lihat pelan
          </LinkButton>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert>
      <IconInfoCircle />
      <AlertTitle>Tinggal satu {noun} lagi</AlertTitle>
      <AlertDescription>
        Anda menggunakan {used} daripada {cap} {noun} pada pelan semasa.
      </AlertDescription>
    </Alert>
  )
}
