import type { Metadata } from "next"

import { CirclesPage } from "@/components/circles/circles-page"

export const metadata: Metadata = {
  title: "Circle",
}

export default function CirclesRoutePage() {
  return <CirclesPage />
}
