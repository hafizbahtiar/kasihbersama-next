import type { Metadata } from "next"

import { NotificationsPage } from "@/components/notifications-page"

export const metadata: Metadata = {
  title: "Notifikasi",
}

export default function NotificationsRoutePage() {
  return <NotificationsPage />
}
