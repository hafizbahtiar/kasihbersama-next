import { ProfileDetailPage } from "@/components/care/profile-detail-page"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return { title: `Profil jagaan ${id}` }
}

export default async function CareProfileDetailRoutePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ProfileDetailPage profileId={id} />
}
