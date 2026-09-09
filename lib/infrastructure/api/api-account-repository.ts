import type { AuthUser } from "@/lib/domain/auth"
import type { AccountRepository } from "@/lib/domain/account-repository"
import type {
  DeviceToken,
  NotificationChannel,
  ProfileNotificationPref,
  ReminderType,
} from "@/lib/domain/account"
import type { ApiClient } from "@/lib/infrastructure/api/client"
import type { MeResponse } from "@/lib/infrastructure/api/types"

type ApiNotificationPref = {
  care_profile_id: string
  channel: string
  reminder_type: string
  enabled: boolean
  created_at: string
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

function mapNotificationPref(api: ApiNotificationPref): ProfileNotificationPref {
  return {
    careProfileId: api.care_profile_id,
    channel: api.channel as NotificationChannel,
    reminderType: api.reminder_type as ReminderType,
    enabled: api.enabled,
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
}
