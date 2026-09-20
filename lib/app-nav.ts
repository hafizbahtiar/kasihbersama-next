import type { ComponentType, SVGProps } from "react"
import { IconBell, IconSettings, IconUsersGroup } from "@tabler/icons-react"

export type AppNavIcon = ComponentType<SVGProps<SVGSVGElement>>

export type AppNavItem = {
  href: string
  title: string
  icon: AppNavIcon
  /**
   * Hidden unless the ACTIVE circle grants this permission key. Hiding only;
   * the route itself is still enforced server-side.
   */
  permission?: string
}

// Navigasi v0.2 bermula semula. Setiap pautan modul v0.1 dibuang bersama skrinnya -
// pautan ke laluan yang sudah tiada ialah 404 yang kelihatan seperti pepijat. Modul
// v0.2 menambah entrinya sendiri bila skrinnya wujud.
export const primaryNav: AppNavItem[] = [
  // Tiada permission: senarai circle datang daripada bootstrap, dan pengguna
  // tanpa circle memerlukan skrin ini paling-paling untuk mencipta yang pertama.
  { href: "/circles", title: "Circle", icon: IconUsersGroup },
]

// Bahagian "Akaun" di bawah sidebar: pemberitahuan dan tetapan ialah hal AKAUN,
// bukan hal circle - dan lencana belum dibaca sudah ada di navbar, jadi tempatnya
// di sini dan bukan di puncak senarai jagaan.
export const secondaryNav: AppNavItem[] = [
  { href: "/notifications", title: "Pemberitahuan", icon: IconBell },
  { href: "/settings", title: "Tetapan", icon: IconSettings },
]

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
