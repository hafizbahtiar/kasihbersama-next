"use client"

import { usePathname } from "next/navigation"

import { getAppPageTitle, primaryNav, secondaryNav } from "@/lib/app-nav"
import { recordLabelKey } from "@/lib/application/resource-snapshot"
import type { ResourceSnapshot } from "@/lib/application/resource-snapshot"
import { useResourceSnapshot } from "@/components/resource-snapshot-provider"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"

type Crumb = {
  href?: string
  label: string
}

function getCrumbs(
  pathname: string,
  snapshot: ResourceSnapshot | null
): Crumb[] {
  const recordLabels = snapshot?.recordLabels ?? {}
  const schemas = snapshot?.schemas ?? []
  const crumbs: Crumb[] = [{ href: "/home", label: "Laman utama" }]

  if (pathname === "/home") {
    return [{ label: "Laman utama" }]
  }

  if (pathname.startsWith("/invites/accept")) {
    return [
      { href: "/home", label: "Laman utama" },
      { href: "/care-profiles", label: "Profil jagaan" },
      { label: "Terima jemputan" },
    ]
  }

  if (pathname.startsWith("/claims/accept")) {
    return [
      { href: "/home", label: "Laman utama" },
      { href: "/care-profiles", label: "Profil jagaan" },
      { label: "Terima tuntutan" },
    ]
  }

  const navMatch = [...primaryNav, ...secondaryNav].find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )

  if (!navMatch) {
    return [{ label: getAppPageTitle(pathname) }]
  }

  const rest = pathname.slice(navMatch.href.length)
  const parts = rest.split("/").filter(Boolean)

  if (parts.length === 0) {
    crumbs.push({ label: navMatch.title })
    return crumbs
  }

  crumbs.push({ href: navMatch.href, label: navMatch.title })

  if (parts[0] === "new") {
    crumbs.push({ label: "Rekod baharu" })
    return crumbs
  }

  const slug = navMatch.href.replace(/^\//, "")
  const recordLabel = recordLabels[recordLabelKey(slug, parts[0])] ?? parts[0]
  const schema = schemas.find((item) => item.slug === slug)

  if (parts[1] === "edit") {
    crumbs.push({
      href: `${navMatch.href}/${parts[0]}`,
      label: recordLabel,
    })
    crumbs.push({ label: "Sunting" })
    return crumbs
  }

  crumbs.push({ label: recordLabel || schema?.singular || "Rekod" })
  return crumbs
}

export function AppBreadcrumb() {
  const pathname = usePathname()
  const snapshot = useResourceSnapshot()
  const crumbs = getCrumbs(pathname, snapshot ?? null)

  return (
    <Breadcrumb className="min-w-0 flex-1">
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1
          return (
            <BreadcrumbItem key={`${crumb.label}-${index}`}>
              {isLast || !crumb.href ? (
                <BreadcrumbPage className="truncate">
                  {crumb.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={crumb.href} className="truncate">
                  {crumb.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
