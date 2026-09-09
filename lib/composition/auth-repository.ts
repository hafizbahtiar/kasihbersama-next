import { ensureApiClient } from "@/lib/composition/api-client"
import { isMockDataEnabled } from "@/lib/infrastructure/config"
import type { AuthRepository } from "@/lib/domain/auth-repository"
import { ApiAuthRepository } from "@/lib/infrastructure/api/api-auth-repository"
import { seedAccountUser } from "@/lib/infrastructure/mock/account"
import { InMemoryAuthRepository } from "@/lib/infrastructure/mock/in-memory-auth-repository"

let repository: AuthRepository | undefined

export function getAuthRepository(): AuthRepository {
  repository ??= isMockDataEnabled()
    ? new InMemoryAuthRepository(seedAccountUser)
    : new ApiAuthRepository(ensureApiClient())
  return repository
}

export function resetAuthRepository() {
  repository = undefined
}
