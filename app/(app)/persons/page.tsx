import type { Metadata } from "next"

import { CaredPersonsPage } from "@/components/persons/cared-persons-page"

export const metadata: Metadata = {
  title: "Orang dijaga",
}

export default function CaredPersonsRoutePage() {
  return <CaredPersonsPage />
}
