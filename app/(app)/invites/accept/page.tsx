import { AcceptTokenPage } from "@/components/care/accept-token-page"

export const metadata = {
  title: "Terima jemputan",
}

export default async function AcceptInviteRoutePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  return <AcceptTokenPage kind="invite" initialToken={token} />
}
