import type { AuthUser } from "@/lib/domain/auth"
import type { AccountRepository } from "@/lib/domain/account-repository"
import type {
  AccountUsage,
  AuthDevice,
  DeviceToken,
  NotificationChannel,
  ProfileNotificationPref,
  ReminderType,
  UserSession,
} from "@/lib/domain/account"
import { parsePlanId } from "@/lib/domain/platform"
import type { ApiClient } from "@/lib/infrastructure/api/client"
import { ApiError, isApiError } from "@/lib/infrastructure/api/errors"

/**
 * The v0.1 account endpoints answer with a flat user. The v0.2 auth endpoints
 * wrap it as `{user, session}` - a different shape, and these routes have not
 * moved yet, so this stays local instead of borrowing `MeResponse`.
 */
type ApiAccountUser = {
  id: string
  email: string
  display_name: string
  email_verified: boolean
}

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
  absolute_expires_at: string
}

type ApiSessionsResponse = {
  data: ApiSession[]
}

type ApiDevice = {
  id: string
  install_id: string
  platform: string
  name?: string
  model?: string
  os_version?: string
  app_version?: string
  is_trusted: boolean
  trusted_at?: string
  last_seen_at?: string
  created_at: string
}

type ApiDevicesResponse = {
  data: ApiDevice[]
}

type ApiDeviceToken = {
  id: string
  platform: string
  subscription_id: string
  app_version?: string
  created_at: string
}

function mapMe(response: ApiAccountUser): AuthUser {
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
    expiresAt: api.absolute_expires_at,
  }
}

function mapDevice(api: ApiDevice): AuthDevice {
  return {
    id: api.id,
    installId: api.install_id,
    platform: api.platform,
    name: api.name,
    model: api.model,
    osVersion: api.os_version,
    appVersion: api.app_version,
    isTrusted: api.is_trusted,
    trustedAt: api.trusted_at,
    lastSeenAt: api.last_seen_at,
    createdAt: api.created_at,
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
    max_storage_mb: number
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
      maxStorageMb: api.limits.max_storage_mb,
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
    return this.notYetAvailable(
      this.client
        .request<ApiAccountUser>("/me", {
          method: "PATCH",
          body: JSON.stringify({ display_name: displayName }),
        })
        .then(mapMe)
    )
  }

  listNotificationPrefs(careProfileId: string) {
    return this.notYetAvailable(
      this.client
        .request<ApiNotificationPref[]>(
          `/me/notification-preferences?care_profile_id=${encodeURIComponent(careProfileId)}`
        )
        .then((rows) => rows.map(mapNotificationPref))
    )
  }

  updateNotificationPref(input: {
    careProfileId: string
    channel: NotificationChannel
    reminderType: ReminderType
    enabled: boolean
  }) {
    return this.notYetAvailable(
      this.client
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
    )
  }

  listDeviceTokens() {
    return this.notYetAvailable(
      this.client
        .request<ApiDeviceToken[]>("/me/device-tokens")
        .then((rows) => rows.map(mapDeviceToken))
    )
  }

  revokeDeviceToken(tokenId: string) {
    return this.notYetAvailable(
      this.client.request<void>(`/me/device-tokens/${tokenId}`, {
        method: "DELETE",
      })
    )
  }

  changePassword(input: { currentPassword: string; newPassword: string }) {
    return this.client.request<void>("/auth/password/change", {
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
    // v0.2 answers only a message: it mails a confirmation link to the new
    // address, and the change completes at /auth/email/change/confirm. There
    // is no updated user to return.
    return this.client.request<void>("/auth/email/change", {
      method: "POST",
      // See changePassword: 401 is about the body, not the session.
      skipRefresh: true,
      body: JSON.stringify({
        new_email: input.newEmail,
        password: input.currentPassword,
      }),
    })
  }

  deleteAccount(currentPassword: string) {
    // v0.2 answers only a message: it leaves a tombstone and removes no care
    // profiles, so there is nothing to report back.
    return this.client.request<void>("/auth/account/delete", {
      method: "POST",
      // Same reasoning as the other password-gated verbs: a 401 here means
      // the password in the body is wrong, not that the session expired.
      skipRefresh: true,
      body: JSON.stringify({ password: currentPassword }),
    })
  }

  /**
   * Returned as text, not a parsed object: it goes straight to a file the user
   * saves. Parsing and re-serialising it would only risk changing what they
   * receive.
   */
  exportAccount() {
    return this.notYetAvailable(this.client.requestText("/me/export"))
  }

  getUsage() {
    return this.notYetAvailable(
      this.client.request<ApiUsageResponse>("/me/usage").then(mapUsage)
    )
  }

  listSessions() {
    return this.client
      .request<ApiSessionsResponse>("/auth/sessions")
      .then((body) => body.data.map(mapSession))
  }

  revokeSession(sessionId: string) {
    return this.client.request<void>(`/auth/sessions/${sessionId}`, {
      method: "DELETE",
    })
  }

  listDevices() {
    return this.client
      .request<ApiDevicesResponse>("/auth/devices")
      .then((body) => body.data.map(mapDevice))
  }

  revokeDevice(deviceId: string) {
    return this.client.request<void>(`/auth/devices/${deviceId}`, {
      method: "DELETE",
    })
  }

  trustDevice(deviceId: string) {
    // No body: the backend has only this direction, so being asked is the value.
    return this.client.request<void>(`/auth/devices/${deviceId}/trust`, {
      method: "POST",
    })
  }

  /**
   * A 404 from one of the `/me/*` routes says "this feature is not in v0.2",
   * not "the record is gone": v0.2 has no such route, so the backend answers
   * its generic `request.not_found`, which the UI renders as "Rekod tidak
   * dijumpai." - a lie that reads as data loss. Only those routes go through
   * here; a 404 from `/auth/*` is a real bug and keeps its own message.
   */
  private async notYetAvailable<T>(request: Promise<T>): Promise<T> {
    try {
      return await request
    } catch (cause) {
      if (isApiError(cause) && cause.status === 404) {
        throw new ApiError(cause.message, {
          // Client-synthesised, not from the server - nothing sends this code
          // back. It keys the "not available yet" copy in errors.ts.
          code: "account.feature.unavailable",
          status: cause.status,
          requestId: cause.requestId,
          details: cause.details,
        })
      }
      throw cause
    }
  }
}
