import { apiPrefix } from "@/lib/infrastructure/config"
import type { CircleMembership, CircleType } from "@/lib/domain/circle"
import type { Bootstrap } from "@/lib/domain/platform"
import type { PlatformRepository } from "@/lib/domain/platform-repository"
import { mapAuthUser } from "@/lib/infrastructure/api/mappers/auth"
import { tokenStorage } from "@/lib/infrastructure/api/token-storage"
import type { ApiUserDTO } from "@/lib/infrastructure/api/types"

type ApiBootstrap = {
  platform: {
    api_version: string
    server_time: string
    min_supported_build: number
    latest_build: number
    force_update: boolean
    limits: {
      max_image_mb: number
      max_pdf_mb: number
      max_circle_storage_mb: number
      max_owned_circles: number
    }
  }
  account?: {
    user: ApiUserDTO
    active_circle_id: string | null
    circles: Array<{
      id: string
      name: string
      type: string
      owner_user_id: string
      timezone: string
      member_id: string
      role_key: string
      joined_at: string
    }>
    permissions: string[]
    unread_notifications: number
  }
}

function mapBootstrap(api: ApiBootstrap): Bootstrap {
  const p = api.platform
  const bootstrap: Bootstrap = {
    platform: {
      apiVersion: p.api_version,
      serverTime: p.server_time,
      minSupportedBuild: p.min_supported_build,
      latestBuild: p.latest_build,
      forceUpdate: p.force_update,
      limits: {
        maxImageMb: p.limits.max_image_mb,
        maxPdfMb: p.limits.max_pdf_mb,
        maxCircleStorageMb: p.limits.max_circle_storage_mb,
        maxOwnedCircles: p.limits.max_owned_circles,
      },
    },
  }
  if (api.account) {
    bootstrap.account = {
      user: mapAuthUser(api.account.user),
      activeCircleId: api.account.active_circle_id,
      circles: (api.account.circles ?? []).map(
        (c): CircleMembership => ({
          id: c.id,
          name: c.name,
          type: c.type as CircleType,
          ownerUserId: c.owner_user_id,
          timezone: c.timezone,
          memberId: c.member_id,
          roleKey: c.role_key,
          joinedAt: c.joined_at,
        })
      ),
      permissions: api.account.permissions ?? [],
      unreadNotifications: api.account.unread_notifications,
    }
  }
  return bootstrap
}

/**
 * Bootstrap is the one call that does not go through `ApiClient`: the token is
 * optional here, so a 401 refresh dance would be wrong, and an expired token
 * must degrade to the platform block rather than sign the user out.
 */
export class ApiPlatformRepository implements PlatformRepository {
  constructor(private readonly baseUrl: string) {}

  async getBootstrap(appBuild: number): Promise<Bootstrap> {
    const headers: Record<string, string> = {}
    if (appBuild > 0) {
      // Omitted rather than sent as 0: the gate cannot judge what it was not
      // given, and 0 would read as a build older than every minimum.
      headers["X-App-Build"] = String(appBuild)
    }
    const access = tokenStorage.readAccess()
    if (access) {
      headers.Authorization = `Bearer ${access}`
    }
    const response = await fetch(`${apiPrefix(this.baseUrl)}/bootstrap`, {
      headers,
    })
    if (!response.ok) {
      throw new Error(`Bootstrap gagal (${response.status})`)
    }
    return mapBootstrap((await response.json()) as ApiBootstrap)
  }
}
