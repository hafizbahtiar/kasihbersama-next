import type { Metadata } from "next"

import { ComparePage } from "@/components/pricing/compare-page"

export const metadata: Metadata = {
  title: "Banding pelan",
}

export default function ComparePlansRoutePage() {
  return <ComparePage />
}
