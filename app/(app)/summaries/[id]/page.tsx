import type { Metadata } from "next"

import { SummaryDetailPage } from "@/components/summaries/summary-detail-page"

export const metadata: Metadata = {
  title: "Ringkasan",
}

export default async function SummaryRoutePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <SummaryDetailPage summaryId={id} />
}
