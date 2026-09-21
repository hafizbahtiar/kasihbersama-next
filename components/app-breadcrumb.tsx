"use client"

import { usePathname } from "next/navigation"

import { usePlatform } from "@/components/platform/platform-provider"
import { buildCrumbs } from "@/lib/app-nav"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"

/**
 * Breadcrumb v0.2. Versi lama membawa 117 baris kes khas untuk laluan yang kini
 * 404; versi ini membina jejaknya daripada laluan sebenar, jadi setiap skrin
 * bersarang baharu mewarisi jalan naik tanpa kes khasnya sendiri.
 */
export function AppBreadcrumb() {
  const pathname = usePathname()
  const { circles } = usePlatform()

  const crumbs = buildCrumbs(
    pathname,
    (circleId) => circles.find((c) => c.id === circleId)?.name
  )

  if (crumbs.length === 0) {
    return null
  }

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList
        className="flex-nowrap"
        items={crumbs}
      >
        {(crumb) => (
          <BreadcrumbItem className="min-w-0 overflow-hidden">
            {({ isCurrent }) =>
              isCurrent || !crumb.href ? (
                <BreadcrumbPage className="block min-w-0 truncate">
                  {crumb.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={crumb.href} className="block min-w-0 truncate">
                  {crumb.label}
                </BreadcrumbLink>
              )
            }
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
