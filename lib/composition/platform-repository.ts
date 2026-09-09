import { getApiBaseUrl, isMockDataEnabled } from "@/lib/infrastructure/config"
import type { PlatformRepository } from "@/lib/domain/platform-repository"
import { ApiPlatformRepository } from "@/lib/infrastructure/api/api-platform-repository"
import { mockBootstrap } from "@/lib/infrastructure/mock/platform"

let repository: PlatformRepository | undefined

export function getPlatformRepository(): PlatformRepository {
  if (!repository) {
    repository = isMockDataEnabled()
      ? {
          async getBootstrap() {
            return mockBootstrap
          },
        }
      : new ApiPlatformRepository(getApiBaseUrl())
  }
  return repository
}

export function resetPlatformRepository() {
  repository = undefined
}
