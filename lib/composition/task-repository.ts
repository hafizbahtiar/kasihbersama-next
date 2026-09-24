import { ensureApiClient } from "@/lib/composition/api-client"
import type { TaskRepository } from "@/lib/domain/task-repository"
import { ApiTaskRepository } from "@/lib/infrastructure/api/api-task-repository"

// Tiada kembar mock: lihat circle-repository.
let repository: TaskRepository | undefined

export function getTaskRepository(): TaskRepository {
  if (!repository) {
    repository = new ApiTaskRepository(ensureApiClient())
  }
  return repository
}

export function resetTaskRepository() {
  repository = undefined
}
