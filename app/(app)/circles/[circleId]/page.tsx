import type { Metadata } from "next"

import { CircleDetail } from "@/components/circles/circle-detail"

export const metadata: Metadata = {
  title: "Urus circle",
}

export default async function CircleDetailRoutePage({
  params,
}: {
  params: Promise<{ circleId: string }>
}) {
  const { circleId } = await params
  return <CircleDetail circleId={circleId} />
}
