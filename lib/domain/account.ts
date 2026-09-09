import type { PlanId } from "@/lib/domain/platform"

export type NotificationChannel = "push" | "email"

export type ReminderType = "medication" | "appointment" | "task"

export type ProfileNotificationPref = {
  careProfileId: string
  channel: NotificationChannel
  reminderType: ReminderType
  enabled: boolean
  createdAt: string
}

export type DeviceToken = {
  id: string
  platform: "ios" | "android"
  subscriptionId: string
  appVersion?: string
  createdAt: string
}

export const NOTIFICATION_CHANNELS: NotificationChannel[] = ["push", "email"]

export const REMINDER_TYPES: ReminderType[] = [
  "medication",
  "appointment",
  "task",
]

export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  medication: "Peringatan ubat",
  appointment: "Peringatan temujanji",
  task: "Peringatan tugasan",
}

export const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  push: "Push",
  email: "E-mel",
}

/** Reminder types with an active backend push trigger today. */
export const PUSH_ENABLED_REMINDER_TYPES: ReminderType[] = ["medication"]

export const PLATFORM_LABELS: Record<DeviceToken["platform"], string> = {
  ios: "iOS",
  android: "Android",
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

export type DeleteAccountResult = {
  anonymizedAt: string
  /** Profiles removed along with the account. Never silent. */
  deletedCareProfileIds: string[]
}

/**
 * Current counts against this account's live limits (`GET /me/usage`).
 *
 * Profile `used` excludes the own-health record. Storage is live R2 bytes,
 * not Postgres care data, and has no cap yet.
 */
export type AccountUsage = {
  plan: PlanId
  limits: {
    maxProfiles: number
    maxMembers: number
    maxUploadMb: number
  }
  profiles: { used: number }
  storage: { usedBytes: number }
  members: Array<{
    careProfileId: string
    displayName: string
    used: number
  }>
}
