"use client"

import { IconPrinter } from "@tabler/icons-react"

import { useCareProfile } from "@/components/care/care-data-provider"
import { EmergencyCardView } from "@/components/care/emergency-card-view"
import { PageHeader } from "@/components/care/page-header"
import { SelectProfileEmpty } from "@/components/care/select-profile-empty"
import { Button } from "@/components/ui/button"

export function EmergencyCardPage({
  /**
   * Named explicitly by the caller when it matters - /my-health passes the
   * user's own record.
   *
   * Falling back to the selected care profile is only for the bare
   * /emergency-card route, and that fallback is exactly what made "preview my
   * own card" show a relative's: setSelectedProfileId is rejected when the id
   * is absent from the loaded snapshot, and the provider quietly substitutes
   * the default profile. A preview of one person's card has to name that
   * person rather than ask global state who is currently selected.
   */
  profileId: explicitProfileId,
}: {
  profileId?: string
}) {
  const { selectedProfile } = useCareProfile()
  const profileId = explicitProfileId ?? selectedProfile?.id
  const isOwn = Boolean(explicitProfileId)

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
          title={isOwn ? "Kad kecemasan saya" : "Kad kecemasan"}
          description="Maklumat kritikal untuk ditunjukkan kepada doktor atau paramedik. Ketik butang untuk lihat belakang kad."
          actions={
            <Button variant="outline" onPress={() => window.print()}>
              <IconPrinter />
              Cetak
            </Button>
          }
        />
      </div>

      {/* Only your own record has a place to fill it in from here; for
          someone you look after, the edit lives on their profile. */}
      <EmergencyCardView
        profileId={profileId}
        completeHref={isOwn ? "/my-health" : undefined}
      />
    </div>
  )
}
