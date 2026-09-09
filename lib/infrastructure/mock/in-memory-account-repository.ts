import type { AuthUser } from "@/lib/domain/auth"
import type {
  DeviceToken,
  NotificationChannel,
  ProfileNotificationPref,
  ReminderType,
} from "@/lib/domain/account"
import type { AccountRepository } from "@/lib/domain/account-repository"

type MockState = {
  user: AuthUser
  prefs: ProfileNotificationPref[]
  devices: DeviceToken[]
}

export class InMemoryAccountRepository implements AccountRepository {
  private state: MockState

  constructor(initial: MockState) {
    this.state = structuredClone(initial)
  }

  async updateDisplayName(displayName: string) {
    this.state.user = { ...this.state.user, displayName }
    return structuredClone(this.state.user)
  }

  async listNotificationPrefs(careProfileId: string) {
    return this.state.prefs.filter(
      (item) => item.careProfileId === careProfileId
    )
  }

  async updateNotificationPref(input: {
    careProfileId: string
    channel: NotificationChannel
    reminderType: ReminderType
    enabled: boolean
  }) {
    const existing = this.state.prefs.find(
      (item) =>
        item.careProfileId === input.careProfileId &&
        item.channel === input.channel &&
        item.reminderType === input.reminderType
    )
    if (existing) {
      existing.enabled = input.enabled
      return structuredClone(existing)
    }
    const created: ProfileNotificationPref = {
      careProfileId: input.careProfileId,
      channel: input.channel,
      reminderType: input.reminderType,
      enabled: input.enabled,
      createdAt: new Date().toISOString(),
    }
    this.state.prefs.unshift(created)
    return structuredClone(created)
  }

  async listDeviceTokens() {
    return structuredClone(this.state.devices)
  }

  async revokeDeviceToken(tokenId: string) {
    this.state.devices = this.state.devices.filter(
      (item) => item.id !== tokenId
    )
  }
}
