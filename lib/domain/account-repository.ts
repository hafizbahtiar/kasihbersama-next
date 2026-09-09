import type { AuthUser } from "@/lib/domain/auth"
import type {
  DeleteAccountResult,
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

  /**
   * Erases the account. Password-gated: this is the most destructive action in
   * the app.
   *
   * Rejects with an ApiError carrying code "deletion_blocked" when a care
   * profile still needs a decision - read the list with
   * `deletionBlockersFromError`.
   */
  deleteAccount(currentPassword: string): Promise<DeleteAccountResult>

  /** The caller's own data, as a JSON string ready to save to a file. */
  exportAccount(): Promise<string>
}
