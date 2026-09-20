import type { Bootstrap } from "@/lib/domain/platform"

export type PlatformRepository = {
  getBootstrap(appBuild: number): Promise<Bootstrap>
}
