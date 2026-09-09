import type { AuthUser } from "@/lib/domain/auth"
import type { AccountRepository } from "@/lib/domain/account-repository"
import type {
  AccountUsage,
  DeviceToken,
  NotificationChannel,
  ProfileNotificationPref,
  ReminderType,
  UserSession,
} from "@/lib/domain/account"
import { parsePlanId } from "@/lib/domain/platform"
import type { ApiClient } from "@/lib/infrastructure/api/client"
import type {
  ApiDeleteAccountResponse,
  MeResponse,
} from "@/lib/infrastructure/api/types"

type ApiNotificationPref = {
  care_profile_id: string
  channel: string
  reminder_type: string
  enabled: boolean
  created_at: string
}

type ApiSession = {
  id: string
  user_agent?: string
  ip_address?: string
  current: boolean
  created_at: string
  expires_at: string
}

type ApiSessionsResponse = {
  sessions: ApiSession[]
}

type ApiDeviceToken = {
  id: string
  platform: string
  subscription_id: string
  app_version?: string
  created_at: string
}

function mapMe(response: MeResponse): AuthUser {
  return {
    id: response.id,
    email: response.email,
    displayName: response.display_name,
    emailVerified: response.email_verified,
  }
}

function mapNotificationPref(
  api: ApiNotificationPref
): ProfileNotificationPref {
  return {
    careProfileId: api.care_profile_id,
    channel: api.channel as NotificationChannel,
    reminderType: api.reminder_type as ReminderType,
    enabled: api.enabled,
    createdAt: api.created_at,
  }
}

function mapSession(api: ApiSession): UserSession {
  return {
    id: api.id,
    userAgent: api.user_agent,
    ipAddress: api.ip_address,
    current: api.current,
    createdAt: api.created_at,
    expiresAt: api.expires_at,
  }
}

function mapDeviceToken(api: ApiDeviceToken): DeviceToken {
  return {
    id: api.id,
    platform: api.platform as DeviceToken["platform"],
    subscriptionId: api.subscription_id,
    appVersion: api.app_version,
    createdAt: api.created_at,
  }
}

type ApiUsageResponse = {
  plan: string
  limits: {
    max_profiles: number
    max_members: number
    max_upload_mb: number
  }
  profiles: { used: number }
  storage: { used_bytes: number }
  members: Array<{
    care_profile_id: string
    display_name: string
    used: number
  }>
}

function mapUsage(api: ApiUsageResponse): AccountUsage {
  return {
    plan: parsePlanId(api.plan) ?? "free",
    limits: {
      maxProfiles: api.limits.max_profiles,
      maxMembers: api.limits.max_members,
      maxUploadMb: api.limits.max_upload_mb,
    },
    profiles: { used: api.profiles.used },
    storage: { usedBytes: api.storage.used_bytes },
    members: (api.members ?? []).map((row) => ({
      careProfileId: row.care_profile_id,
      displayName: row.display_name,
      used: row.used,
    })),
  }
}

export class ApiAccountRepository implements AccountRepository {
  constructor(private readonly client: ApiClient) {}

  updateDisplayName(displayName: string) {
    return this.client
      .request<MeResponse>("/me", {
        method: "PATCH",
        body: JSON.stringify({ display_name: displayName }),
      })
      .then(mapMe)
  }

  listNotificationPrefs(careProfileId: string) {
    return this.client
      .request<ApiNotificationPref[]>(
        `/me/notification-preferences?care_profile_id=${encodeURIComponent(careProfileId)}`
      )
      .then((rows) => rows.map(mapNotificationPref))
  }

  updateNotificationPref(input: {
    careProfileId: string
    channel: NotificationChannel
    reminderType: ReminderType
    enabled: boolean
  }) {
    return this.client
      .request<ApiNotificationPref>(
        `/me/notification-preferences?care_profile_id=${encodeURIComponent(input.careProfileId)}`,
        {
          method: "PUT",
          body: JSON.stringify({
            channel: input.channel,
            reminder_type: input.reminderType,
            enabled: input.enabled,
          }),
        }
      )
      .then(mapNotificationPref)
  }

  listDeviceTokens() {
    return this.client
      .request<ApiDeviceToken[]>("/me/device-tokens")
      .then((rows) => rows.map(mapDeviceToken))
  }

  revokeDeviceToken(tokenId: string) {
    return this.client.request<void>(`/me/device-tokens/${tokenId}`, {
      method: "DELETE",
    })
  }

  changePassword(input: { currentPassword: string; newPassword: string }) {
    return this.client.request<void>("/me/password", {
      method: "POST",
      // skipRefresh: a 401 here means the password in the body is wrong, never
      // that the session expired. Without this the client treats it as an
      // expired token, spends a refresh rotation on every typo, and a user
      // whose refresh happens to fail is signed out for mistyping their own
      // password.
      skipRefresh: true,
      body: JSON.stringify({
        current_password: input.currentPassword,
        new_password: input.newPassword,
      }),
    })
  }

  changeEmail(input: { currentPassword: string; newEmail: string }) {
    return this.client
      .request<MeResponse>("/me/email", {
        method: "POST",
        // See changePassword: 401 is about the body, not the session.
        skipRefresh: true,
        body: JSON.stringify({
          current_password: input.currentPassword,
          new_email: input.newEmail,
        }),
      })
      .then(mapMe)
  }

  deleteAccount(currentPassword: string) {
    return this.client
      .request<ApiDeleteAccountResponse>("/me/delete", {
        method: "POST",
        // Same reasoning as the other password-gated verbs: a 401 here means
        // the password in the body is wrong, not that the session expired.
        skipRefresh: true,
        body: JSON.stringify({ current_password: currentPassword }),
      })
      .then((response) => ({
        anonymizedAt: response.anonymized_at,
        deletedCareProfileIds: response.deleted_care_profile_ids ?? [],
      }))
  }

  /**
   * Returned as text, not a parsed object: it goes straight to a file the user
   * saves. Parsing and re-serialising it would only risk changing what they
   * receive.
   */
  exportAccount() {
    return this.client.requestText("/me/export")
  }

  getUsage() {
    return this.client.request<ApiUsageResponse>("/me/usage").then(mapUsage)
  }

  listSessions() {
    return this.client
      .request<ApiSessionsResponse>("/me/sessions")
      .then((body) => body.sessions.map(mapSession))
  }

  revokeSession(sessionId: string) {
    return this.client.request<void>(`/me/sessions/${sessionId}`, {
      method: "DELETE",
    })
  }
}
