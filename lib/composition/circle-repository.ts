import { ensureApiClient } from "@/lib/composition/api-client"
import type { CircleRepository } from "@/lib/domain/circle-repository"
import { ApiCircleRepository } from "@/lib/infrastructure/api/api-circle-repository"

// No in-memory twin: the v0.1 mocks were for screens that no longer exist, and
// a fake circle graph is a lot of fixture for nothing that is being demoed.
// Mock mode therefore talks to the API here like every other caller.
let repository: CircleRepository | undefined

export function getCircleRepository(): CircleRepository {
  if (!repository) {
    repository = new ApiCircleRepository(ensureApiClient())
  }
  return repository
}

export function resetCircleRepository() {
  repository = undefined
}
