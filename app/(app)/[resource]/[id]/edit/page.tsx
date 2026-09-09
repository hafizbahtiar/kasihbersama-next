import { notFound } from "next/navigation"

import { ResourceForm } from "@/components/resource-form"
import { listResourceRecordParams } from "@/lib/application/resource-routes"
import { getResourceRepository } from "@/lib/composition/resource-repository"

export async function generateStaticParams() {
  return listResourceRecordParams(getResourceRepository())
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ resource: string; id: string }>
}) {
  const { resource, id } = await params
  const record = await getResourceRepository().getRecord(resource, id)
  return { title: record ? `Sunting ${record.name}` : "Sunting" }
}

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ resource: string; id: string }>
}) {
  const { resource: slug, id } = await params
  const repository = getResourceRepository()
  const resource = await repository.getSchema(slug)
  const record = await repository.getRecord(slug, id)

  if (!resource || !record) {
    notFound()
  }

  return <ResourceForm resource={resource} record={record} mode="edit" />
}
