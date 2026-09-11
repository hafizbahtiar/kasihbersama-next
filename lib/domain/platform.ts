export type PlatformFeature =
  | "doctor_summary"
  | "profile_claim"
  | "document_upload"
  | "caregiver_mode"
  | "growth_chart"

export type PlatformFeatures = Record<PlatformFeature, boolean>

export type PlanId = "free" | "family" | "care_home"

export type PlatformLimits = {
  maxUploadMb: number
  maxProfilesFree: number
  maxMembersFree: number
}

export type BootstrapConfig = {
  apiVersion: string
  serverTime: string
  minSupportedBuild: number
  latestBuild: number
  forceUpdate: boolean
  features: PlatformFeatures
  /** Free-plan catalogue. Pricing page free column. */
  limits: PlatformLimits
  /** This account's live caps. Absent when bootstrap had no usable token. */
  accountLimits?: PlatformLimits
  plan?: PlanId
}

export const DEFAULT_PLATFORM_FEATURES: PlatformFeatures = {
  growth_chart: false,
  doctor_summary: false,
  profile_claim: false,
  document_upload: false,
  caregiver_mode: false,
}

export const DEFAULT_PLATFORM_LIMITS: PlatformLimits = {
  maxUploadMb: 10,
  maxProfilesFree: 1,
  maxMembersFree: 3,
}

export function parsePlanId(value: string | undefined): PlanId | undefined {
  if (value === "free" || value === "family" || value === "care_home") {
    return value
  }
  return undefined
}

export function planDisplayName(plan?: PlanId): string {
  if (plan === "family") {
    return "Keluarga"
  }
  if (plan === "care_home") {
    return "Rumah Jagaan"
  }
  return "Percuma"
}
