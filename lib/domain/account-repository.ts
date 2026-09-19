import type { AuthUser } from "@/lib/domain/auth"
import type {
  AccountUsage,
  AuthDevice,
  DeviceToken,
  NotificationChannel,
  ProfileNotificationPref,
  ReminderType,
  UserSession,
  UserSettings,
  UserSettingsPatch,
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
  /** Asks to move the account to a new address. Resolves once the confirmation
   * link has been sent; the address itself does not move until it is followed. */
  changeEmail(input: {
    currentPassword: string
    newEmail: string
  }): Promise<void>

  listSessions(): Promise<UserSession[]>
  revokeSession(sessionId: string): Promise<void>

  /** The devices the account has signed in from. */
  listDevices(): Promise<AuthDevice[]>
  revokeDevice(deviceId: string): Promise<void>
  /**
   * Marks one device trusted. There is no untrust: the backend can only ever
   * set trust to true.
   */
  trustDevice(deviceId: string): Promise<void>

  /**
   * Erases the account. Password-gated: this is the most destructive action in
   * the app.
   *
   * Rejects with an ApiError carrying code "auth.account.owns_circle" when the
   * caller still owns a circle. That error names no profiles - the backend has
   * no list to give - so the UI shows its message alone.
   */
  deleteAccount(currentPassword: string): Promise<void>

  /** The caller's own data, as a JSON string ready to save to a file. */
  exportAccount(): Promise<string>

  /** Current counts against the limits this account is held to. */
  getUsage(): Promise<AccountUsage>

  /** Display preferences. Defaults are returned until the account saves one. */
  getSettings(): Promise<UserSettings>
  /**
   * A partial write: only the keys present in `patch` are sent, so the backend
   * leaves every other setting untouched. Resolves with the full settings as
   * the server stored them - never with a client-side guess.
   */
  updateSettings(patch: UserSettingsPatch): Promise<UserSettings>
}
