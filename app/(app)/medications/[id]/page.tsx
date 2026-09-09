import { MedicationDetailPage } from "@/components/care/medication-detail-page"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return { title: `Ubat ${id}` }
}

export default async function MedicationDetailRoutePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <MedicationDetailPage medicationId={id} />
}
