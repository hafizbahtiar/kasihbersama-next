import type { ResourceRecord, ResourceSchema } from "@/lib/domain/resource"
import type { ResourceRepository } from "@/lib/domain/resource-repository"

export class InMemoryResourceRepository implements ResourceRepository {
  constructor(
    private readonly schemas: readonly ResourceSchema[],
    private readonly recordsBySlug: Readonly<Record<string, ResourceRecord[]>>
  ) {}

  async listSchemas() {
    return [...this.schemas]
  }

  async getSchema(slug: string) {
    return this.schemas.find((schema) => schema.slug === slug) ?? null
  }

  async listRecords(slug: string) {
    return [...(this.recordsBySlug[slug] ?? [])]
  }

  async getRecord(slug: string, id: string) {
    const records = await this.listRecords(slug)
    return records.find((record) => record.id === id) ?? null
  }
}
