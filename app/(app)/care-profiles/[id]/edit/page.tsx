import { ProfileFormPage } from "@/components/care/profile-form-page"

export const metadata = {
  title: "Sunting profil jagaan",
}

export default async function EditCareProfileRoutePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ProfileFormPage profileId={id} />
}
