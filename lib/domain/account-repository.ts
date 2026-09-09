import type { AuthUser } from "@/lib/domain/auth"
import type {
  DeviceToken,
  NotificationChannel,
  ProfileNotificationPref,
  ReminderType,
} from "@/lib/domain/account"

export interface AccountRepository {
  updateDisplayName(displayName: string): Promise<AuthUser>
  listNotificationPrefs(careProfileId: string): Promise<ProfileNotificationPref[]>
  updateNotificationPref(input: {
    careProfileId: string
    channel: NotificationChannel
    reminderType: ReminderType
    enabled: boolean
  }): Promise<ProfileNotificationPref>
  listDeviceTokens(): Promise<DeviceToken[]>
  revokeDeviceToken(tokenId: string): Promise<void>
}
