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
