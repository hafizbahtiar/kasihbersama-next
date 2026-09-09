import type { BootstrapConfig } from "@/lib/domain/platform"

export type PlatformRepository = {
  getBootstrap(appBuild: number): Promise<BootstrapConfig>
}
