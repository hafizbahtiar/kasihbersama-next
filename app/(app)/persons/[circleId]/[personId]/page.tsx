import type { Metadata } from "next"

import { PersonHealthPage } from "@/components/health/person-health-page"

export const metadata: Metadata = {
  title: "Rekod kesihatan",
}

/**
 * Skrin yang SAMA seperti `/circles/{id}/persons/{id}`, dicapai melalui pintasan
 * "Orang dijaga".
 *
 * Laluan ialah jejaknya: seseorang yang masuk melalui pintasan mahu naik semula ke
 * pintasan itu, bukan ke circle yang kebetulan memiliki orang itu. Menyimpan satu
 * laluan sahaja bermakna breadcrumb terpaksa meneka dari mana pelawat datang, dan
 * tekaan itu salah separuh masa.
 */
export default async function CaredPersonHealthRoutePage({
  params,
}: {
  params: Promise<{ circleId: string; personId: string }>
}) {
  const { circleId, personId } = await params
  return (
    <PersonHealthPage
      circleId={circleId}
      personId={personId}
      backHref="/persons"
    />
  )
}
