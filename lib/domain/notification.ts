import type { ResourceRecord } from "@/lib/domain/resource"

export const NOTIFICATION_AUDIENCE = {
  user: "Pengguna",
  admin: "Admin",
} as const

export type NotificationAudience =
  (typeof NOTIFICATION_AUDIENCE)[keyof typeof NOTIFICATION_AUDIENCE]

export function isUserNotification(record: ResourceRecord) {
  return record.audience === NOTIFICATION_AUDIENCE.user
}

export function isAdminNotification(record: ResourceRecord) {
  return record.audience === NOTIFICATION_AUDIENCE.admin
}
