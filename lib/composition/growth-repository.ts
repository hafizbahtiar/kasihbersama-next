import { ensureApiClient } from "@/lib/composition/api-client"
import type { GrowthRepository } from "@/lib/domain/growth-repository"
import { ApiGrowthRepository } from "@/lib/infrastructure/api/api-growth-repository"
import { isMockDataEnabled } from "@/lib/infrastructure/config"
import {
  growthSeed,
  InMemoryGrowthRepository,
} from "@/lib/infrastructure/mock/in-memory-growth-repository"

let repository: GrowthRepository | undefined

export function getGrowthRepository(): GrowthRepository {
  if (!repository) {
    repository = isMockDataEnabled()
      ? new InMemoryGrowthRepository(growthSeed)
      : new ApiGrowthRepository(ensureApiClient())
  }
  return repository
}

export function resetGrowthRepository() {
  repository = undefined
}
