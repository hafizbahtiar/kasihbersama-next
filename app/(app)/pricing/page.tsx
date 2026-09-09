import type { Metadata } from "next"

import { PricingPage } from "@/components/pricing/pricing-page"

export const metadata: Metadata = {
  title: "Pelan",
}

export default function PricingRoutePage() {
  return <PricingPage />
}
