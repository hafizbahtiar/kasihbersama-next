"use client"

import { usePathname } from "next/navigation"

import { getAppPageTitle } from "@/lib/app-nav"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"

/**
 * Breadcrumb v0.2. Versi lama membawa 117 baris kes khas untuk laluan care - profil,
 * circle, rekod bersarang - yang setiap satunya kini 404. Ia akan tumbuh semula bila
 * skrin bersarang wujud semula; sehingga itu, tajuk halaman sudah memadai dan tidak
 * boleh menunjuk ke mana-mana yang tidak wujud.
 */
export function AppBreadcrumb() {
  const pathname = usePathname()
  const title = getAppPageTitle(pathname)

  if (!title) {
    return null
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbPage>{title}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
