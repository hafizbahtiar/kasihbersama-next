import { ensureApiClient } from "@/lib/composition/api-client"
import type { CareRepository } from "@/lib/domain/care-repository"
import { ApiCareRepository } from "@/lib/infrastructure/api/api-care-repository"

// Tiada kembar mock: lihat circle-repository.
let repository: CareRepository | undefined

export function getCareRepository(): CareRepository {
  if (!repository) {
    repository = new ApiCareRepository(ensureApiClient())
  }
  return repository
}

export function resetCareRepository() {
  repository = undefined
}