import type { BootstrapConfig } from "@/lib/domain/platform"

export const mockBootstrap: BootstrapConfig = {
  apiVersion: "v1",
  serverTime: new Date().toISOString(),
  minSupportedBuild: 1,
  latestBuild: 1,
  forceUpdate: false,
  features: {
    doctor_summary: true,
    profile_claim: true,
    document_upload: true,
    caregiver_mode: true,
  },
  limits: {
    maxUploadMb: 25,
    maxProfilesFree: 3,
    maxMembersFree: 8,
  },
  accountLimits: {
    maxUploadMb: 25,
    maxProfilesFree: 3,
    maxMembersFree: 8,
  },
  plan: "free",
}
