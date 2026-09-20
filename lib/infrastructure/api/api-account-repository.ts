import type { AccountRepository } from "@/lib/domain/account-repository"
import type {
  AuthDevice,
  DeviceToken,
  DistanceUnit,
  NotificationCategory,
  NotificationChannel,
  NotificationPreferences,
  NotificationPreferencesPatch,
  ThemePreference,
  TimeFormat,
  UserSession,
  UserSettings,
  UserSettingsPatch,
  WeekStart,
} from "@/lib/domain/account"
import type { ApiClient } from "@/lib/infrastructure/api/client"
import { ApiError, isApiError } from "@/lib/infrastructure/api/errors"
import { mapAuthUser } from "@/lib/infrastructure/api/mappers/auth"
import type { UpdateMeResponse } from "@/lib/infrastructure/api/types"

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

type ApiNotificationPreferences = {
  quiet_hours_start?: string
  quiet_hours_end?: string
  digest_enabled: boolean
  digest_at: string
  categories: Array<{
    key: string
    name: string
    is_mandatory: boolean
    channels: Array<{
      channel: string
      is_enabled: boolean
      is_locked: boolean
    }>
  }>
}

type ApiDeviceToken = {
  id: string
  provider_subscription_id: string
  platform: string
  device_id?: string
  last_seen_at?: string
  created_at: string
}

type ApiDeviceTokensResponse = {
  data: ApiDeviceToken[]
}

function mapNotificationPreferences(
  api: ApiNotificationPreferences
): NotificationPreferences {
  return {
    quietHoursStart: api.quiet_hours_start,
    quietHoursEnd: api.quiet_hours_end,
    digestEnabled: api.digest_enabled,
    digestAt: api.digest_at,
    categories: (api.categories ?? []).map(
      (category): NotificationCategory => ({
        key: category.key,
        name: category.name,
        isMandatory: category.is_mandatory,
        channels: (category.channels ?? []).map((channel) => ({
          channel: channel.channel as NotificationChannel,
          isEnabled: channel.is_enabled,
          isLocked: channel.is_locked,
        })),
      })
    ),
  }
}

function mapDeviceToken(api: ApiDeviceToken): DeviceToken {
  return {
    id: api.id,
    providerSubscriptionId: api.provider_subscription_id,
    platform: api.platform,
    deviceId: api.device_id,
    lastSeenAt: api.last_seen_at,
    createdAt: api.created_at,
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

type ApiSettings = {
  theme: string
  date_format: string
  time_format: string
  week_starts_on: number
  distance_unit: string
  preferences: Record<string, unknown> | null
}

type ApiSettingsResponse = {
  settings: ApiSettings
}

function mapSettings(api: ApiSettings): UserSettings {
  return {
    theme: api.theme as ThemePreference,
    dateFormat: api.date_format,
    timeFormat: api.time_format as TimeFormat,
    weekStartsOn: api.week_starts_on as WeekStart,
    distanceUnit: api.distance_unit as DistanceUnit,
    preferences: api.preferences ?? {},
  }
}

export class ApiAccountRepository implements AccountRepository {
  constructor(private readonly client: ApiClient) {}

  updateDisplayName(displayName: string) {
    // Sparse patch: only the field being changed is sent, so the rest of the
    // profile is left as it is. An empty string would be a deliberate clear.
    return this.client
      .request<UpdateMeResponse>("/me", {
        method: "PATCH",
        body: JSON.stringify({ display_name: displayName }),
      })
      .then((response) => mapAuthUser(response.user))
  }

  getNotificationPreferences() {
    return this.client
      .request<ApiNotificationPreferences>("/me/notification-preferences")
      .then(mapNotificationPreferences)
  }

  updateNotificationPreferences(patch: NotificationPreferencesPatch) {
    // Sparse, same contract as updateSettings: an absent key is "do not
    // touch". A quiet hour set to "" is a deliberate clear, so the check is
    // `!== undefined` and not a truthiness test.
    const body: Record<string, unknown> = {}
    if (patch.quietHoursStart !== undefined) {
      body.quiet_hours_start = patch.quietHoursStart
    }
    if (patch.quietHoursEnd !== undefined) {
      body.quiet_hours_end = patch.quietHoursEnd
    }
    if (patch.digestEnabled !== undefined) {
      body.digest_enabled = patch.digestEnabled
    }
    if (patch.digestAt !== undefined) {
      body.digest_at = patch.digestAt
    }
    if (patch.preferences !== undefined) {
      body.preferences = patch.preferences.map((pref) => ({
        category_key: pref.categoryKey,
        channel: pref.channel,
        is_enabled: pref.isEnabled,
      }))
    }
    return this.client
      .request<ApiNotificationPreferences>("/me/notification-preferences", {
        method: "PATCH",
        body: JSON.stringify(body),
      })
      .then(mapNotificationPreferences)
  }

  listDeviceTokens() {
    return this.client
      .request<ApiDeviceTokensResponse>("/me/device-tokens")
      .then((body) => (body.data ?? []).map(mapDeviceToken))
  }

  revokeDeviceToken(deviceTokenId: string) {
    return this.client.request<void>(
      `/me/device-tokens/${encodeURIComponent(deviceTokenId)}`,
      { method: "DELETE" }
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

  getSettings() {
    return this.client
      .request<ApiSettingsResponse>("/me/settings")
      .then((body) => mapSettings(body.settings))
  }

  updateSettings(patch: UserSettingsPatch) {
    // Sparse on purpose: the backend reads a missing key as "do not touch", so
    // sending only the keys the caller set is what keeps a partial patch from
    // resetting the rest. A default here would silently overwrite a field the
    // caller never mentioned.
    const body: Record<string, unknown> = {}
    if (patch.dateFormat !== undefined) {
      body.date_format = patch.dateFormat
    }
    if (patch.timeFormat !== undefined) {
      body.time_format = patch.timeFormat
    }
    if (patch.weekStartsOn !== undefined) {
      body.week_starts_on = patch.weekStartsOn
    }
    if (patch.distanceUnit !== undefined) {
      body.distance_unit = patch.distanceUnit
    }
    if (patch.preferences !== undefined) {
      body.preferences = patch.preferences
    }
    return this.client
      .request<ApiSettingsResponse>("/me/settings", {
        method: "PATCH",
        body: JSON.stringify(body),
      })
      .then((response) => mapSettings(response.settings))
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
