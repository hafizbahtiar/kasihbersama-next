import type { Metadata } from "next"

import { DashboardPage } from "@/components/care/dashboard-page"

export const metadata: Metadata = {
  title: "Laman utama",
}

export default function HomePage() {
  return <DashboardPage />
}
