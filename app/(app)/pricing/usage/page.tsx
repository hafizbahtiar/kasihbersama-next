import type { Metadata } from "next"

import { UsagePage } from "@/components/pricing/usage-page"

export const metadata: Metadata = {
  title: "Penggunaan",
}

export default function UsageRoutePage() {
  return <UsagePage />
}
