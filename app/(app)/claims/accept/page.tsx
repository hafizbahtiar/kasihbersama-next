import { AcceptTokenPage } from "@/components/care/accept-token-page"

export const metadata = {
  title: "Terima tuntutan",
}

export default async function AcceptClaimRoutePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  return <AcceptTokenPage kind="claim" initialToken={token} />
}
