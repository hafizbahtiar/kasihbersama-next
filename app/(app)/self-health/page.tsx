import type { Metadata } from "next"

import { SelfHealthPage } from "@/components/self-health-page"

export const metadata: Metadata = {
  title: "Kad kecemasan",
}

export default function SelfHealthRoutePage() {
  return <SelfHealthPage />
}