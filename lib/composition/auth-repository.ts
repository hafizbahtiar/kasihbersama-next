import { ensureApiClient } from "@/lib/composition/api-client"
import type { AuthRepository } from "@/lib/domain/auth-repository"
import { ApiAuthRepository } from "@/lib/infrastructure/api/api-auth-repository"

let repository: AuthRepository | undefined

export function getAuthRepository(): AuthRepository {
  repository ??= new ApiAuthRepository(ensureApiClient())
  return repository
}
