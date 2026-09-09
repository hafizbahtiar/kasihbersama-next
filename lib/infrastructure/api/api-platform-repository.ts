import type {
  BootstrapConfig,
  PlatformFeatures,
  PlatformLimits,
} from "@/lib/domain/platform"
import type { PlatformRepository } from "@/lib/domain/platform-repository"

type ApiBootstrapResponse = {
  api_version: string
  server_time: string
  min_supported_build: number
  latest_build: number
  force_update: boolean
  features: Record<string, boolean>
  limits: {
    max_upload_mb: number
    max_profiles_free: number
    max_members_free: number
  }
}

function mapFeatures(raw: Record<string, boolean>): PlatformFeatures {
  return {
    doctor_summary: Boolean(raw.doctor_summary),
    profile_claim: Boolean(raw.profile_claim),
    document_upload: Boolean(raw.document_upload),
    caregiver_mode: Boolean(raw.caregiver_mode),
  }
}

function mapLimits(raw: ApiBootstrapResponse["limits"]): PlatformLimits {
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
  }
}

export class ApiPlatformRepository implements PlatformRepository {
  constructor(private readonly baseUrl: string) {}

  async getBootstrap(appBuild: number): Promise<BootstrapConfig> {
    const url = `${this.baseUrl.replace(/\/$/, "")}/api/v1/bootstrap`
    const response = await fetch(url, {
      headers: {
        "X-App-Build": String(appBuild),
      },
    })
    if (!response.ok) {
      throw new Error(`Bootstrap gagal (${response.status})`)
    }
    const data = (await response.json()) as ApiBootstrapResponse
    return mapBootstrap(data)
  }
}
