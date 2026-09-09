import { isUserNotification } from "@/lib/domain/notification"
import type { ResourceRecord, ResourceSchema } from "@/lib/domain/resource"
import type { ResourceRepository } from "@/lib/domain/resource-repository"
import type { CareSnapshotReader } from "@/lib/domain/care-repository"

export type ResourceSnapshot = {
  schemas: ResourceSchema[]
  recordLabels: Record<string, string>
  notifications: ResourceRecord[]
}

export function recordLabelKey(slug: string, id: string) {
  return `${slug}:${id}`
}

/**
 * `care` is typed as CareSnapshotReader, not CareRepository: this needs one
 * method of forty-eight, and saying so keeps the dependency honest. It is a
 * parameter rather than a reach into the composition root, which an
 * application-layer module has no business knowing about.
 */
export async function createResourceSnapshot(
  repository: ResourceRepository,
  care: CareSnapshotReader
): Promise<ResourceSnapshot> {
  const schemas = await repository.listSchemas()
  const recordLabels: Record<string, string> = {}

  for (const schema of schemas) {
    const records = await repository.listRecords(schema.slug)
    for (const record of records) {
      recordLabels[recordLabelKey(schema.slug, record.id)] = record.name
    }
  }

  const careSnapshot = await care.getSnapshot()
  for (const profile of careSnapshot.profiles) {
    recordLabels[recordLabelKey("care-profiles", profile.id)] =
      profile.displayName
  }
  for (const circle of careSnapshot.circles) {
    recordLabels[recordLabelKey("circles", circle.id)] = circle.name
  }
  for (const medication of careSnapshot.medications) {
    recordLabels[recordLabelKey("medications", medication.id)] = medication.name
  }

  const notifications = (await repository.listRecords("notifications"))
    .filter(isUserNotification)
    .slice(0, 3)

  return { schemas, recordLabels, notifications }
}
