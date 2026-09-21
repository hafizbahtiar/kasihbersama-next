import { ensureApiClient } from "@/lib/composition/api-client"
import type { HealthRepository } from "@/lib/domain/health-repository"
import { ApiHealthRepository } from "@/lib/infrastructure/api/api-health-repository"

// Tiada kembar mock: lihat circle-repository.
let repository: HealthRepository | undefined

export function getHealthRepository(): HealthRepository {
  if (!repository) {
    repository = new ApiHealthRepository(ensureApiClient())
  }
  return repository
}

export function resetHealthRepository() {
  repository = undefined
}
