import type { AuthUser } from "@/lib/domain/auth"
import {
  MIN_PASSWORD_LENGTH,
  type AuthDevice,
  type DeviceToken,
  type NotificationPreferences,
  type NotificationPreferencesPatch,
  type UserSession,
  type UserSettings,
  type UserSettingsPatch,
} from "@/lib/domain/account"
import type { AccountRepository } from "@/lib/domain/account-repository"
import { ApiError } from "@/lib/infrastructure/api/errors"

type MockState = {
  user: AuthUser
  prefs: NotificationPreferences
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

  async getUsage(circleId?: string) {
    // The same free-plan ceilings the server enforces, so mock mode never promises a
    // plan the backend would refuse. Usage itself is reported empty: this mock keeps
    // no circle or person store - the platform and circle mocks do.
    return {
      plan: "free",
      limits: {
        ownedCircles: 1,
        personsPerCircle: 3,
        membersPerCircle: 3,
        storageBytesPerCircle: 250 << 20,
      },
      usage: {
        ownedCircles: 0,
        circle: circleId
          ? { id: circleId, personCount: 0, memberCount: 0, storageBytes: 0 }
          : null,
      },
    }
  }

  async getNotificationPreferences() {
    return structuredClone(this.state.prefs)
  }

  async updateNotificationPreferences(patch: NotificationPreferencesPatch) {
    const prefs = this.state.prefs
    if (patch.quietHoursStart !== undefined) {
      prefs.quietHoursStart = patch.quietHoursStart || undefined
    }
    if (patch.quietHoursEnd !== undefined) {
      prefs.quietHoursEnd = patch.quietHoursEnd || undefined
    }
    if (patch.digestEnabled !== undefined) {
      prefs.digestEnabled = patch.digestEnabled
    }
    if (patch.digestAt !== undefined) {
      prefs.digestAt = patch.digestAt
    }
    for (const wanted of patch.preferences ?? []) {
      const category = prefs.categories.find(
        (item) => item.key === wanted.categoryKey
      )
      const channel = category?.channels.find(
        (item) => item.channel === wanted.channel
      )
      if (!channel) {
        continue
      }
      // Mirrors the backend: a locked channel is refused, not silently
      // ignored, so the UI's snap-back path is exercised in mock mode too.
      if (channel.isLocked) {
        throw new ApiError("Kategori ini wajib.", {
          code: "notification.category.mandatory",
          status: 400,
        })
      }
      channel.isEnabled = wanted.isEnabled
    }
    return structuredClone(prefs)
  }

  async listDeviceTokens() {
    return structuredClone(this.state.devices)
  }

  async revokeDeviceToken(deviceTokenId: string) {
    this.state.devices = this.state.devices.filter(
      (item) => item.id !== deviceTokenId
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
