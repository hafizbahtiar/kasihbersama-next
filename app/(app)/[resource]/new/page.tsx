import { notFound } from "next/navigation"

import { ResourceForm } from "@/components/resource-form"
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
  return {
    title: item ? `Tambah ${item.singular.toLowerCase()}` : "Rekod baharu",
  }
}

export default async function NewResourcePage({
  params,
  searchParams,
}: {
  params: Promise<{ resource: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { resource: slug } = await params
  const query = await searchParams
  const resource = await getResourceRepository().getSchema(slug)

  if (!resource) {
    notFound()
  }

  const defaults = Object.fromEntries(
    resource.fields.flatMap((field) => {
      const value = query[field.name]
      const resolved = Array.isArray(value) ? value[0] : value
      return resolved ? [[field.name, resolved]] : []
    })
  )

  return <ResourceForm resource={resource} mode="new" defaults={defaults} />
}
