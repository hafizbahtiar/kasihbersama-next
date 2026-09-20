import type { ComponentType, SVGProps } from "react"
import { IconSettings } from "@tabler/icons-react"

import type { PlatformFeature } from "@/lib/domain/platform"

export type AppNavIcon = ComponentType<SVGProps<SVGSVGElement>>

export type AppNavItem = {
  href: string
  title: string
  icon: AppNavIcon
  feature?: PlatformFeature
}

// Navigasi v0.2 bermula semula. Setiap pautan modul v0.1 dibuang bersama skrinnya -
// pautan ke laluan yang sudah tiada ialah 404 yang kelihatan seperti pepijat. Modul
// v0.2 menambah entrinya sendiri bila skrinnya wujud.
export const primaryNav: AppNavItem[] = [
  { href: "/settings", title: "Tetapan", icon: IconSettings },
]

export const secondaryNav: AppNavItem[] = []

const allNavItems = [...primaryNav, ...secondaryNav]

/** Longest matching href wins so /pricing/usage does not also light up /pricing. */
export function isNavActive(pathname: string, href: string) {
  if (href === "/settings") {
    return pathname.startsWith("/settings")
  }

  const matches = allNavItems
    .map((item) => item.href)
    .filter(
      (candidate) =>
        pathname === candidate || pathname.startsWith(`${candidate}/`)
    )
    .sort((a, b) => b.length - a.length)

  return matches[0] === href
}

export function getAppPageTitle(pathname: string) {
  const match = allNavItems.find((item) => isNavActive(pathname, item.href))
  return match?.title ?? "Laman utama"
}
