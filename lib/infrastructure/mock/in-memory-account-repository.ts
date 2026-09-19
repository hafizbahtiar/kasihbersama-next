import type { AuthUser } from "@/lib/domain/auth"
import {
  MIN_PASSWORD_LENGTH,
  type AccountUsage,
  type AuthDevice,
  type DeviceToken,
  type NotificationChannel,
  type ProfileNotificationPref,
  type ReminderType,
  type UserSession,
  type UserSettings,
  type UserSettingsPatch,
} from "@/lib/domain/account"
import type { AccountRepository } from "@/lib/domain/account-repository"
import { ApiError } from "@/lib/infrastructure/api/errors"

type MockState = {
  user: AuthUser
  prefs: ProfileNotificationPref[]
  devices: DeviceToken[]
  sessions: UserSession[]
  authDevices: AuthDevice[]
  settings: UserSettings
  password: string
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

  async changePassword(input: {
    currentPassword: string
    newPassword: string
  }) {
    this.assertPassword(input.currentPassword)
    if (input.newPassword.length < MIN_PASSWORD_LENGTH) {
      throw new ApiError("Kata laluan terlalu pendek.", {
        code: "unprocessable",
        status: 422,
      })
    }
    this.state.password = input.newPassword
    // Mirrors the backend: every session but the current one is ended.
    this.state.sessions = this.state.sessions.filter((item) => item.current)
  }

  async changeEmail(input: { currentPassword: string; newEmail: string }) {
    this.assertPassword(input.currentPassword)
    this.state.user = {
      ...this.state.user,
      email: input.newEmail.trim().toLowerCase(),
      // A new address is unverified by definition - the demo has to show the
      // banner that follows, not a silently verified account.
      emailVerified: false,
    }
  }

  async listSessions() {
    return structuredClone(this.state.sessions)
  }

  async revokeSession(sessionId: string) {
    const target = this.state.sessions.find((item) => item.id === sessionId)
    if (!target) {
      throw new ApiError("Sesi tidak dijumpai.", {
        code: "not_found",
        status: 404,
      })
    }
    this.state.sessions = this.state.sessions.filter(
      (item) => item.id !== sessionId
    )
  }

  async listDevices() {
    return structuredClone(this.state.authDevices)
  }

  async revokeDevice(deviceId: string) {
    this.findDevice(deviceId)
    this.state.authDevices = this.state.authDevices.filter(
      (item) => item.id !== deviceId
    )
  }

  async trustDevice(deviceId: string) {
    const device = this.findDevice(deviceId)
    device.isTrusted = true
    device.trustedAt = new Date().toISOString()
  }

  // Mirrors the backend's `auth.device.not_found`, and the sessions above.
  private findDevice(deviceId: string) {
    const device = this.state.authDevices.find((item) => item.id === deviceId)
    if (!device) {
      throw new ApiError("Peranti tidak dijumpai.", {
        code: "auth.device.not_found",
        status: 404,
      })
    }
    return device
  }

  async deleteAccount(currentPassword: string) {
    this.assertPassword(currentPassword)
  }

  async exportAccount() {
    return JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        account: {
          id: this.state.user.id,
          email: this.state.user.email,
          display_name: this.state.user.displayName,
          email_verified: this.state.user.emailVerified,
        },
        memberships: [],
        audit_events: [],
      },
      null,
      2
    )
  }

  async getUsage(): Promise<AccountUsage> {
    return {
      plan: "free",
      limits: { maxProfiles: 3, maxMembers: 8, maxUploadMb: 25, maxStorageMb: 500 },
      profiles: { used: 0 },
      storage: { usedBytes: 0 },
      members: [],
    }
  }

  async getSettings() {
    return structuredClone(this.state.settings)
  }

  async updateSettings(patch: UserSettingsPatch) {
    // Same sparse semantics as the backend: an absent key stays as it was, and
    // preferences merge per key rather than replacing the whole bag.
    const settings = this.state.settings
    if (patch.dateFormat !== undefined) {
      settings.dateFormat = patch.dateFormat
    }
    if (patch.timeFormat !== undefined) {
      settings.timeFormat = patch.timeFormat
    }
    if (patch.weekStartsOn !== undefined) {
      settings.weekStartsOn = patch.weekStartsOn
    }
    if (patch.distanceUnit !== undefined) {
      settings.distanceUnit = patch.distanceUnit
    }
    if (patch.preferences !== undefined) {
      settings.preferences = { ...settings.preferences, ...patch.preferences }
    }
    return structuredClone(settings)
  }

  private assertPassword(candidate: string) {
    if (candidate !== this.state.password) {
      throw new ApiError("Kata laluan semasa tidak tepat.", {
        code: "unauthenticated",
        status: 401,
      })
    }
  }
}
