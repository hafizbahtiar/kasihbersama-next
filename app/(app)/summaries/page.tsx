import type { Metadata } from "next"

import { SummariesPage } from "@/components/summaries/summaries-page"

export const metadata: Metadata = {
  title: "Ringkasan doktor",
}

export default function SummariesRoutePage() {
  return <SummariesPage />
}
