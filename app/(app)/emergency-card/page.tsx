import type { Metadata } from "next"

import { EmergencyCardPage } from "@/components/care/emergency-card-page"

export const metadata: Metadata = {
  title: "Kad kecemasan",
}

export default async function EmergencyCardRoutePage({
  searchParams,
}: {
  searchParams: Promise<{ profile?: string }>
}) {
  // ?profile= names the record to preview. Without it the page falls back to
  // the selected care profile, which is the right default when you arrive
  // from the sidebar and the wrong one when you arrive from "my own card".
  const { profile } = await searchParams
  return <EmergencyCardPage profileId={profile} />
}
