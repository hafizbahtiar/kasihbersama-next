import type {
  BootstrapConfig,
  PlatformFeatures,
  PlatformLimits,
} from "@/lib/domain/platform"
import { parsePlanId } from "@/lib/domain/platform"
import type { PlatformRepository } from "@/lib/domain/platform-repository"
import { tokenStorage } from "@/lib/infrastructure/api/token-storage"

type LimitBlock = {
  max_upload_mb: number
  max_profiles_free: number
  max_members_free: number
}

type ApiBootstrapResponse = {
  api_version: string
  server_time: string
  min_supported_build: number
  latest_build: number
  force_update: boolean
  features: Record<string, boolean>
  limits: LimitBlock
  account_limits?: LimitBlock
  plan?: string
}

function mapFeatures(raw: Record<string, boolean>): PlatformFeatures {
  return {
    doctor_summary: Boolean(raw.doctor_summary),
    profile_claim: Boolean(raw.profile_claim),
    document_upload: Boolean(raw.document_upload),
    caregiver_mode: Boolean(raw.caregiver_mode),
    growth_chart: Boolean(raw.growth_chart),
  }
}

function mapLimits(raw: LimitBlock): PlatformLimits {
  return {
    maxUploadMb: raw.max_upload_mb,
    maxProfilesFree: raw.max_profiles_free,
    maxMembersFree: raw.max_members_free,
  }
}

function mapBootstrap(api: ApiBootstrapResponse): BootstrapConfig {
  return {
    apiVersion: api.api_version,
    serverTime: api.server_time,
    minSupportedBuild: api.min_supported_build,
    latestBuild: api.latest_build,
    forceUpdate: api.force_update,
    features: mapFeatures(api.features),
    limits: mapLimits(api.limits),
    accountLimits: api.account_limits
      ? mapLimits(api.account_limits)
      : undefined,
    plan: parsePlanId(api.plan),
  }
}

export class ApiPlatformRepository implements PlatformRepository {
  constructor(private readonly baseUrl: string) {}

  async getBootstrap(appBuild: number): Promise<BootstrapConfig> {
    const url = `${this.baseUrl.replace(/\/$/, "")}/api/v1/bootstrap`
    const headers: Record<string, string> = {
      "X-App-Build": String(appBuild),
    }
    const access = tokenStorage.readAccess()
    if (access) {
      headers.Authorization = `Bearer ${access}`
    }
    const response = await fetch(url, { headers })
    if (!response.ok) {
      throw new Error(`Bootstrap gagal (${response.status})`)
    }
    const data = (await response.json()) as ApiBootstrapResponse
    return mapBootstrap(data)
  }
}
