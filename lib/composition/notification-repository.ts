import { ensureApiClient } from "@/lib/composition/api-client"
import type { NotificationRepository } from "@/lib/domain/notification-repository"
import { ApiNotificationRepository } from "@/lib/infrastructure/api/api-notification-repository"

// See circle-repository: no in-memory twin until something needs to demo an
// inbox without a server.
let repository: NotificationRepository | undefined

export function getNotificationRepository(): NotificationRepository {
  if (!repository) {
    repository = new ApiNotificationRepository(ensureApiClient())
  }
  return repository
}

export function resetNotificationRepository() {
  repository = undefined
}
