"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { PageLoadingState } from "@/components/care/page-loading-state"
import { useCareProfile } from "@/components/care/care-data-provider"

/**
 * Deep-link landing for medication reminder push payloads:
 * data.medication_id (+ optional care_profile_id) from backend push sender.
 *
 * Example: /reminders/medication?medication_id=<uuid>&care_profile_id=<uuid>
 */
export function MedicationReminderDeepLinkPage() {
  const router = useRouter()
  const params = useSearchParams()
  const { setSelectedProfileId } = useCareProfile()

  useEffect(() => {
    const profileId = params.get("care_profile_id")
    const medicationId = params.get("medication_id")

    if (profileId) {
      setSelectedProfileId(profileId)
    }

    if (medicationId) {
      router.replace(`/medications/${medicationId}`)
      return
    }

    router.replace("/medications")
  }, [params, router, setSelectedProfileId])

  return <PageLoadingState label="Membuka peringatan ubat..." />
}
