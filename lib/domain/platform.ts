export type PlatformFeature =
  "doctor_summary" | "profile_claim" | "document_upload" | "caregiver_mode"

export type PlatformFeatures = Record<PlatformFeature, boolean>

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
  limits: PlatformLimits
}

export const DEFAULT_PLATFORM_FEATURES: PlatformFeatures = {
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
