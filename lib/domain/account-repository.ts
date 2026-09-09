import type { AuthUser } from "@/lib/domain/auth"
import type {
  DeviceToken,
  NotificationChannel,
  ProfileNotificationPref,
  ReminderType,
  UserSession,
} from "@/lib/domain/account"

export interface AccountRepository {
  updateDisplayName(displayName: string): Promise<AuthUser>
  listNotificationPrefs(
    careProfileId: string
  ): Promise<ProfileNotificationPref[]>
  updateNotificationPref(input: {
    careProfileId: string
    channel: NotificationChannel
    reminderType: ReminderType
    enabled: boolean
  }): Promise<ProfileNotificationPref>
  listDeviceTokens(): Promise<DeviceToken[]>
  revokeDeviceToken(tokenId: string): Promise<void>

  /**
   * Both security writes take the current password even though the caller is
   * already signed in: a password change ends every other session, and the
   * email address is the account-recovery route.
   */
  changePassword(input: {
    currentPassword: string
    newPassword: string
  }): Promise<void>
  /** Resolves with the account as it now stands - `emailVerified: false`. */
  changeEmail(input: {
    currentPassword: string
    newEmail: string
  }): Promise<AuthUser>

  listSessions(): Promise<UserSession[]>
  revokeSession(sessionId: string): Promise<void>
}
