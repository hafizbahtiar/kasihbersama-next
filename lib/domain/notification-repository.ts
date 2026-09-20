import type { AppNotification } from "@/lib/domain/notification"
import type { Page } from "@/lib/domain/pagination"

export interface NotificationRepository {
  inbox(cursor?: string): Promise<Page<AppNotification>>
  /** Idempotent: marking a read row again is not an error. */
  markRead(notificationId: string): Promise<void>
  /** Stronger than read - it says the thing was DONE, and escalation reads it. */
  acknowledge(notificationId: string): Promise<void>
}
