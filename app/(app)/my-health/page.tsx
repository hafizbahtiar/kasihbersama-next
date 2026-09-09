import type { Metadata } from "next"

import { OwnHealthPage } from "@/components/health/own-health-page"

export const metadata: Metadata = {
  title: "Kesihatan saya",
}

export default function MyHealthRoutePage() {
  return <OwnHealthPage />
}
