import type { AccountRepository } from "@/lib/domain/account-repository"
import type {
  AccountUsage,
  AuthDevice,
  DeviceToken,
  DistanceUnit,
  NotificationChannel,
  ProfileNotificationPref,
  ReminderType,
  ThemePreference,
  TimeFormat,
  UserSession,
  UserSettings,
  UserSettingsPatch,
  WeekStart,
} from "@/lib/domain/account"
import { parsePlanId } from "@/lib/domain/platform"
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
    // Sparse patch: only the field being changed is sent, so the rest of the
    // profile is left as it is. An empty string would be a deliberate clear.
    return this.client
      .request<UpdateMeResponse>("/me", {
        method: "PATCH",
        body: JSON.stringify({ display_name: displayName }),
      })
      .then((response) => mapAuthUser(response.user))
  }

  // The next four are not migrated, and deliberately make no request.
  //
  // v0.2 does have `/v1/me/notification-preferences` and `/v1/me/device-tokens`,
  // but under its notification module and with different models: preferences
  // are per-user categories x channels with quiet hours, not per-profile
  // reminder rows, and push subscriptions come back in a `{data, meta}`
  // envelope keyed by `provider_subscription_id`. These calls still speak the
  // retired shape, so a request would return 200 with the wrong shape and crash
  // on `.map` - worse than saying so. The code matches the 404 case, so the UI
  // copy is unchanged.
  listNotificationPrefs(_careProfileId: string) {
    return this.notMigrated<ProfileNotificationPref[]>()
  }

  updateNotificationPref(_input: {
    careProfileId: string
    channel: NotificationChannel
    reminderType: ReminderType
    enabled: boolean
  }) {
    return this.notMigrated<ProfileNotificationPref>()
  }

  listDeviceTokens() {
    return this.notMigrated<DeviceToken[]>()
  }

  revokeDeviceToken(_tokenId: string) {
    return this.notMigrated<void>()
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

  /** For a feature the v0.2 backend models differently and this client has not
   * adopted. Rejects without touching the network - see the comment on the
   * notification and device-token methods for why. */
  private notMigrated<T>(): Promise<T> {
    return Promise.reject(
      new ApiError("Ciri ini belum tersedia buat masa ini.", {
        code: "account.feature.unavailable",
        status: 0,
      })
    )
  }
}
