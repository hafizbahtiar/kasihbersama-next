import type { Metadata } from "next"

import { EmergencyCardPage } from "@/components/care/emergency-card-page"

export const metadata: Metadata = {
  title: "Kad kecemasan",
}

export default function EmergencyCardRoutePage() {
  return <EmergencyCardPage />
}
