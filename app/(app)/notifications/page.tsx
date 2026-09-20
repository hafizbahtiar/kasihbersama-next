import type { Metadata } from "next"

import { NotificationInbox } from "@/components/notifications/notification-inbox"

export const metadata: Metadata = {
  title: "Pemberitahuan",
}

export default function NotificationsRoutePage() {
  return <NotificationInbox />
}
