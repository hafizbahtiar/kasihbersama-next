import type { AuthUser } from "@/lib/domain/auth"
import type {
  DeviceToken,
  ProfileNotificationPref,
  UserSession,
} from "@/lib/domain/account"

export const seedAccountUser: AuthUser = {
  id: "user-me",
  email: "penjaga@contoh.com",
  displayName: "Penjaga",
  emailVerified: true,
}

export const seedNotificationPrefs: ProfileNotificationPref[] = [
  {
    careProfileId: "cp-1",
    channel: "push",
    reminderType: "medication",
    enabled: true,
    createdAt: new Date().toISOString(),
  },
]

export const seedDeviceTokens: DeviceToken[] = [
  {
    id: "dev-1",
    platform: "ios",
    subscriptionId: "mock-subscription-ios",
    appVersion: "1.0.0",
    createdAt: new Date().toISOString(),
  },
  {
    id: "dev-2",
    platform: "android",
    subscriptionId: "mock-subscription-android",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

/**
 * The password the mock account answers to.
 *
 * Mock mode exists to demo flows, and a "current password" field that accepts
 * anything demos the wrong flow: the whole point of these two forms is that
 * they are password-gated, and a reviewer clicking through would never see the
 * failure state.
 */
export const seedAccountPassword = "katalaluanlama"

export const seedSessions: UserSession[] = [
  {
    id: "ses-current",
    userAgent: "Chrome 141 · macOS",
    ipAddress: "203.0.113.7",
    current: true,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "ses-phone",
    userAgent: "Kasih Bersama · Android",
    ipAddress: "203.0.113.42",
    current: false,
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
  },
]
