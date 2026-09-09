import { ensureApiClient } from "@/lib/composition/api-client"
import { isMockDataEnabled } from "@/lib/composition/config"
import type { AccountRepository } from "@/lib/domain/account-repository"
import { ApiAccountRepository } from "@/lib/infrastructure/api/api-account-repository"
import {
  seedAccountUser,
  seedDeviceTokens,
  seedNotificationPrefs,
} from "@/lib/infrastructure/mock/account"
import { InMemoryAccountRepository } from "@/lib/infrastructure/mock/in-memory-account-repository"

let repository: AccountRepository | undefined

export function getAccountRepository(): AccountRepository {
  if (!repository) {
    repository = isMockDataEnabled()
      ? new InMemoryAccountRepository({
          user: seedAccountUser,
          prefs: seedNotificationPrefs,
          devices: seedDeviceTokens,
        })
      : new ApiAccountRepository(ensureApiClient())
  }
  return repository
}

export function resetAccountRepository() {
  repository = undefined
}
