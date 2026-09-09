import { notFound } from "next/navigation"

import { ResourceList } from "@/components/resource-list"
import { listResourceSlugParams } from "@/lib/application/resource-routes"
import { getResourceRepository } from "@/lib/composition/resource-repository"

export async function generateStaticParams() {
  return listResourceSlugParams(getResourceRepository())
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ resource: string }>
}) {
  const { resource } = await params
  const item = await getResourceRepository().getSchema(resource)
  return { title: item?.title ?? "Rekod" }
}

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ resource: string }>
}) {
  const { resource: slug } = await params
  const repository = getResourceRepository()
  const schema = await repository.getSchema(slug)

  if (!schema) {
    notFound()
  }

  const records = await repository.listRecords(slug)

  return <ResourceList schema={schema} records={records} />
}
