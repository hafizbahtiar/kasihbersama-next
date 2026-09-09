import type { Metadata } from "next"

import { SettingsPage } from "@/components/settings-page"

export const metadata: Metadata = {
  title: "Tetapan",
}

export default function SettingsRoutePage() {
  return <SettingsPage />
}
