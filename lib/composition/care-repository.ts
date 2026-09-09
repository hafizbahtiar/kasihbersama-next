import { ensureApiClient } from "@/lib/composition/api-client"
import { isMockDataEnabled } from "@/lib/infrastructure/config"
import type { CareRepository } from "@/lib/domain/care-repository"
import { ApiCareRepository } from "@/lib/infrastructure/api/api-care-repository"
import { InMemoryCareRepository } from "@/lib/infrastructure/mock/in-memory-care-repository"
import { careSeed } from "@/lib/infrastructure/mock/care-seed"

let repository: CareRepository | undefined

export function getCareRepository(): CareRepository {
  if (!repository) {
    repository = isMockDataEnabled()
      ? new InMemoryCareRepository(careSeed)
      : new ApiCareRepository(ensureApiClient())
  }
  return repository
}

export function resetCareRepository() {
  repository = undefined
}
