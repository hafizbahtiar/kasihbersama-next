import type { Metadata } from "next"

import { MedicationReminderDeepLinkPage } from "@/components/notifications/medication-reminder-deep-link"

export const metadata: Metadata = {
  title: "Peringatan ubat",
}

export default function MedicationReminderRoutePage() {
  return <MedicationReminderDeepLinkPage />
}
