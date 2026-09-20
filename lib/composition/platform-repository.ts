import { getApiBaseUrl } from "@/lib/infrastructure/config"
import type { PlatformRepository } from "@/lib/domain/platform-repository"
import { ApiPlatformRepository } from "@/lib/infrastructure/api/api-platform-repository"

let repository: PlatformRepository | undefined

export function getPlatformRepository(): PlatformRepository {
  if (!repository) {
    // Tiada kembar mock: bootstrap ialah SATU panggilan yang berfungsi tanpa token,
    // jadi mod mock tidak perlu menipunya.
    repository = new ApiPlatformRepository(getApiBaseUrl())
  }
  return repository
}

export function resetPlatformRepository() {
  repository = undefined
}
