import type { Metadata } from "next"

import { PersonHealthPage } from "@/components/health/person-health-page"

export const metadata: Metadata = {
  title: "Rekod kesihatan",
}

export default async function PersonHealthRoutePage({
  params,
}: {
  params: Promise<{ circleId: string; personId: string }>
}) {
  const { circleId, personId } = await params
  return <PersonHealthPage circleId={circleId} personId={personId} />
}
