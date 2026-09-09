import { resourceCatalog } from "@/lib/domain/resource-catalog"
import type { ResourceRepository } from "@/lib/domain/resource-repository"
import { InMemoryResourceRepository } from "@/lib/infrastructure/mock/in-memory-resource-repository"
import { seedRecords } from "@/lib/infrastructure/mock/seed-records"

let repository: ResourceRepository | undefined

export function getResourceRepository(): ResourceRepository {
  repository ??= new InMemoryResourceRepository(resourceCatalog, seedRecords)
  return repository
}
