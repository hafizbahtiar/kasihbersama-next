import type { AuthUser } from "@/lib/domain/auth"
import type { DeviceToken, ProfileNotificationPref } from "@/lib/domain/account"

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
