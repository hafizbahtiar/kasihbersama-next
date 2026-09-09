import type { ResourceRecord, ResourceSchema } from "@/lib/domain/resource"

export interface ResourceRepository {
  listSchemas(): Promise<ResourceSchema[]>
  getSchema(slug: string): Promise<ResourceSchema | null>
  listRecords(slug: string): Promise<ResourceRecord[]>
  getRecord(slug: string, id: string): Promise<ResourceRecord | null>
}
