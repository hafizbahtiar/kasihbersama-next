import { CircleDetailPage } from "@/components/care/circle-detail-page"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return { title: `Kumpulan ${id}` }
}

export default async function CircleDetailRoutePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <CircleDetailPage circleId={id} />
}
