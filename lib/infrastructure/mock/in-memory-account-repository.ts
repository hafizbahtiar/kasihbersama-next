import type { AuthUser } from "@/lib/domain/auth"
import {
  MIN_PASSWORD_LENGTH,
  type DeviceToken,
  type NotificationChannel,
  type ProfileNotificationPref,
  type ReminderType,
  type UserSession,
} from "@/lib/domain/account"
import type { AccountRepository } from "@/lib/domain/account-repository"
import { ApiError } from "@/lib/infrastructure/api/errors"

type MockState = {
  user: AuthUser
  prefs: ProfileNotificationPref[]
  devices: DeviceToken[]
  sessions: UserSession[]
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
    return structuredClone(this.state.user)
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

  async deleteAccount(currentPassword: string) {
    this.assertPassword(currentPassword)
    return {
      anonymizedAt: new Date().toISOString(),
      deletedCareProfileIds: [],
    }
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

  private assertPassword(candidate: string) {
    if (candidate !== this.state.password) {
      throw new ApiError("Kata laluan semasa tidak tepat.", {
        code: "unauthenticated",
        status: 401,
      })
    }
  }
}
