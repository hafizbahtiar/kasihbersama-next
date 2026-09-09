import type { ResourceRepository } from "@/lib/domain/resource-repository"

export async function listResourceSlugParams(repository: ResourceRepository) {
  const schemas = await repository.listSchemas()
  return schemas.map((schema) => ({ resource: schema.slug }))
}

export async function listResourceRecordParams(repository: ResourceRepository) {
  const schemas = await repository.listSchemas()
  const params: Array<{ resource: string; id: string }> = []

  for (const schema of schemas) {
    const records = await repository.listRecords(schema.slug)
    for (const record of records) {
      params.push({ resource: schema.slug, id: record.id })
    }
  }

  return params
}
