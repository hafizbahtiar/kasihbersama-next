import type { PlanId } from "@/lib/domain/platform"

/** `delivery_channel` dalam docs/05 §4. `inapp` sentiasa dikunci. */
export type NotificationChannel = "push" | "email" | "sms" | "inapp"

export const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  push: "Push",
  email: "E-mel",
  sms: "SMS",
  inapp: "Dalam aplikasi",
}

/**
 * One channel of one category.
 *
 * `isLocked` means the backend will refuse to turn it off - mandatory
 * categories and the `inapp` channel - so the UI shows state, not a switch.
 */
export type NotificationChannelPref = {
  channel: NotificationChannel
  isEnabled: boolean
  isLocked: boolean
}

export type NotificationCategory = {
  key: string
  name: string
  isMandatory: boolean
  channels: NotificationChannelPref[]
}

/** `GET /v1/me/notification-preferences`. Quiet hours are `HH:MM` local. */
export type NotificationPreferences = {
  quietHoursStart?: string
  quietHoursEnd?: string
  digestEnabled: boolean
  digestAt: string
  categories: NotificationCategory[]
}

/**
 * A partial write. An absent key means "do not touch"; an empty string on a
 * quiet hour means "clear it" - the backend keeps those two intents apart.
 */
export type NotificationPreferencesPatch = {
  quietHoursStart?: string
  quietHoursEnd?: string
  digestEnabled?: boolean
  digestAt?: string
  preferences?: Array<{
    categoryKey: string
    channel: NotificationChannel
    isEnabled: boolean
  }>
}

export const EMPTY_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  digestEnabled: false,
  digestAt: "",
  categories: [],
}

/**
 * A push subscription (`GET /v1/me/device-tokens`) - a device that can be
 * REACHED. Not `AuthDevice`, which is a device that has signed in; two
 * questions, two tables (docs/05 §9).
 */
export type DeviceToken = {
  id: string
  providerSubscriptionId: string
  platform: string
  deviceId?: string
  lastSeenAt?: string
  createdAt: string
}

/** The backend's device platform enum, shared by push tokens and auth devices. */
const PLATFORM_LABELS: Record<string, string> = {
  ios: "iOS",
  android: "Android",
  web: "Pelayar web",
  desktop: "Komputer",
  unknown: "Tidak dikenali",
}

export function platformLabel(platform: string) {
  return PLATFORM_LABELS[platform] ?? platform
}

/**
 * One live login on the account.
 *
 * Carries no token or hash - the backend deliberately omits them - only what a
 * person needs to recognise a device and decide whether it is theirs.
 */
export type UserSession = {
  id: string
  userAgent?: string
  ipAddress?: string
  /** The session making the current request. Never offer to end this one. */
  current: boolean
  createdAt: string
  expiresAt: string
}

/**
 * A device the account has signed in from - the install itself, not a push
 * subscription (`DeviceToken` is that other thing).
 *
 * `isTrusted` only ever moves false→true: the backend has a trust route and no
 * untrust, so no UI should offer the reverse.
 */
export type AuthDevice = {
  id: string
  installId: string
  platform: string
  name?: string
  model?: string
  osVersion?: string
  appVersion?: string
  isTrusted: boolean
  trustedAt?: string
  lastSeenAt?: string
  createdAt: string
}

/** `user_settings.theme`. `next-themes` owns this locally, so the app reads it
 *  but never writes it back - see `UserSettingsPatch`. */
export type ThemePreference = "system" | "light" | "dark"

/**
 * `user_settings.time_format`. Closed set, enforced in the backend's
 * `validateSettings`; `12h` is the schema default.
 */
export type TimeFormat = "12h" | "24h"

/** `user_settings.distance_unit`. Closed set, enforced server-side. */
export type DistanceUnit = "km" | "mi"

/**
 * `user_settings.week_starts_on` - ISO weekday, 1 = Monday … 7 = Sunday.
 * The DB `CHECK (week_starts_on BETWEEN 1 AND 7)` holds it to this range.
 */
export type WeekStart = 1 | 2 | 3 | 4 | 5 | 6 | 7

/**
 * Display preferences (`GET /v1/me/settings`).
 *
 * `dateFormat` is a pattern string, not an enum: the backend only checks it is
 * non-empty (`dd/MM/yyyy` is the schema default), so the token vocabulary is
 * defined by whoever renders it - see `useDisplayFormat`. `preferences` is an
 * open key/value bag the backend stores as JSONB.
 */
export type UserSettings = {
  theme: ThemePreference
  dateFormat: string
  timeFormat: TimeFormat
  weekStartsOn: WeekStart
  distanceUnit: DistanceUnit
  preferences: Record<string, unknown>
}

/**
 * A partial write to `PATCH /v1/me/settings`.
 *
 * Every field is optional and an absent key means "do not touch", mirroring
 * the backend's `omitempty` pointers - a patch never resets what it does not
 * name. `theme` is deliberately absent here: `next-themes` owns the theme
 * locally, and a second writer would give the app two authorities that can
 * disagree.
 */
export type UserSettingsPatch = {
  dateFormat?: string
  timeFormat?: TimeFormat
  weekStartsOn?: WeekStart
  distanceUnit?: DistanceUnit
  preferences?: Record<string, unknown>
}

/** The column defaults from `20260918100100_system_auth.sql`. */
export const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: "system",
  dateFormat: "dd/MM/yyyy",
  timeFormat: "12h",
  weekStartsOn: 1,
  distanceUnit: "km",
  preferences: {},
}

/**
 * Shortest password the backend will accept (`auth.MinPasswordLen`).
 *
 * Only the floor is mirrored here. The full rule - common passwords, keyboard
 * walks, repeats - stays server-side on purpose: a second copy would drift,
 * and the client cannot be the authority on a check that protects the server.
 * A password that clears this length can still be refused with 422, and the
 * form shows that message.
 */
export const MIN_PASSWORD_LENGTH = 10

/**
 * Why a care profile blocks account deletion. The next action differs per
 * reason, so the UI must not collapse them into one message.
 */
export type DeletionBlockReason = "sole_admin" | "shared_subject"

export type DeletionBlocker = {
  id: string
  displayName: string
  reason: DeletionBlockReason
}

export const DELETION_BLOCK_LABELS: Record<DeletionBlockReason, string> = {
  sole_admin: "Anda satu-satunya pentadbir",
  shared_subject: "Profil ini tentang anda dan dikongsi",
}

export const DELETION_BLOCK_FIXES: Record<DeletionBlockReason, string> = {
  sole_admin: "Lantik pentadbir lain dahulu.",
  shared_subject: "Serahkan profil ini atau arkibkannya dahulu.",
}

/**
 * Current counts against this account's live limits (`GET /me/usage`).
 *
 * Profile `used` excludes the own-health record. Storage is live R2 bytes
 * against `limits.maxStorageMb`.
 */
export type AccountUsage = {
  plan: PlanId
  limits: {
    maxProfiles: number
    maxMembers: number
    maxUploadMb: number
    maxStorageMb: number
  }
  profiles: { used: number }
  storage: { usedBytes: number }
  members: Array<{
    careProfileId: string
    displayName: string
    used: number
  }>
}
