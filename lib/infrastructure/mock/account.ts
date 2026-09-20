import type { AuthUser } from "@/lib/domain/auth"
import {
  DEFAULT_USER_SETTINGS,
  type AuthDevice,
  type DeviceToken,
  type NotificationPreferences,
  type UserSession,
  type UserSettings,
} from "@/lib/domain/account"

export const seedAccountUser: AuthUser = {
  id: "user-me",
  email: "penjaga@contoh.com",
  displayName: "Penjaga",
  emailVerified: true,
}

export const seedNotificationPrefs: NotificationPreferences = {
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  digestEnabled: false,
  digestAt: "08:00",
  categories: [
    {
      key: "security",
      name: "Keselamatan akaun",
      isMandatory: true,
      channels: [
        { channel: "inapp", isEnabled: true, isLocked: true },
        { channel: "email", isEnabled: true, isLocked: true },
        { channel: "push", isEnabled: true, isLocked: true },
      ],
    },
    {
      key: "circle",
      name: "Aktiviti circle",
      isMandatory: false,
      channels: [
        { channel: "inapp", isEnabled: true, isLocked: true },
        { channel: "email", isEnabled: true, isLocked: false },
        { channel: "push", isEnabled: false, isLocked: false },
      ],
    },
  ],
}

export const seedDeviceTokens: DeviceToken[] = [
  {
    id: "dev-1",
    providerSubscriptionId: "mock-subscription-ios",
    platform: "ios",
    createdAt: new Date().toISOString(),
  },
  {
    id: "dev-2",
    providerSubscriptionId: "mock-subscription-android",
    platform: "android",
    lastSeenAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

/** Starts on the schema defaults, so the demo shows an untouched account. */
export const seedAccountSettings: UserSettings = {
  ...DEFAULT_USER_SETTINGS,
  preferences: {},
}

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

/** Signed-in devices - one already trusted, one not, so both states show. */
export const seedAuthDevices: AuthDevice[] = [
  {
    id: "dev-web",
    installId: "install-web-1",
    platform: "web",
    name: "Chrome · macOS",
    model: "MacBookPro18,3",
    osVersion: "macOS 15.1",
    appVersion: "1.0.0",
    isTrusted: true,
    trustedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    lastSeenAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "dev-phone",
    installId: "install-phone-1",
    platform: "android",
    name: "Kasih Bersama · Android",
    osVersion: "Android 15",
    appVersion: "1.0.0",
    isTrusted: false,
    lastSeenAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
  },
]
