import { isUserNotification } from "@/lib/domain/notification"
import type { ResourceRecord, ResourceSchema } from "@/lib/domain/resource"
import type { ResourceRepository } from "@/lib/domain/resource-repository"
import { getCareRepository } from "@/lib/composition/care-repository"

export type ResourceSnapshot = {
  schemas: ResourceSchema[]
  recordLabels: Record<string, string>
  notifications: ResourceRecord[]
}

export function recordLabelKey(slug: string, id: string) {
  return `${slug}:${id}`
}

export async function createResourceSnapshot(
  repository: ResourceRepository
): Promise<ResourceSnapshot> {
  const schemas = await repository.listSchemas()
  const recordLabels: Record<string, string> = {}

  for (const schema of schemas) {
    const records = await repository.listRecords(schema.slug)
    for (const record of records) {
      recordLabels[recordLabelKey(schema.slug, record.id)] = record.name
    }
  }

  const care = await getCareRepository().getSnapshot()
  for (const profile of care.profiles) {
    recordLabels[recordLabelKey("care-profiles", profile.id)] = profile.displayName
  }
  for (const circle of care.circles) {
    recordLabels[recordLabelKey("circles", circle.id)] = circle.name
  }
  for (const medication of care.medications) {
    recordLabels[recordLabelKey("medications", medication.id)] = medication.name
  }

  const notifications = (await repository.listRecords("notifications"))
    .filter(isUserNotification)
    .slice(0, 3)

  return { schemas, recordLabels, notifications }
}
