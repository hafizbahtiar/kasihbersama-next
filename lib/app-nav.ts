import type { ComponentType, SVGProps } from "react"
import {
  IconBell,
  IconHeartHandshake,
  IconSettings,
  IconUsersGroup,
} from "@tabler/icons-react"

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
  // Pintasan merentas circle. Ia tiada permission kerana senarainya ditapis oleh
  // `person_access` di pelayan: ahli tanpa geran nampak skrin kosong, bukan 403.
  { href: "/persons", title: "Orang dijaga", icon: IconHeartHandshake },
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

export type Crumb = { id: string; label: string; href?: string }

/**
 * Satu baris per SKRIN - cerminkan setiap `page.tsx` di bawah `app/(app)`.
 * Segmen `:x` ialah segmen dinamik. Skrin bersarang baharu menambah satu baris di sini dan tidak
 * pernah menulis breadcrumbnya sendiri: breadcrumb hidup dalam header, bukan
 * dalam kandungan halaman.
 */
const SCREENS: { path: string; label: string }[] = [
  { path: "/circles", label: "Circle" },
  { path: "/persons", label: "Orang dijaga" },
  { path: "/persons/:circleId/:personId", label: "Rekod kesihatan" },
  { path: "/circles/:circleId", label: "Circle ini" },
  { path: "/circles/:circleId/persons/:personId", label: "Rekod kesihatan" },
  { path: "/notifications", label: "Pemberitahuan" },
  { path: "/settings", label: "Tetapan" },
  { path: "/accept/invite", label: "Terima jemputan" },
]

function screenFor(segments: string[]) {
  return SCREENS.find((screen) => {
    const parts = screen.path.split("/").filter(Boolean)
    return (
      parts.length === segments.length &&
      parts.every((part, i) => part.startsWith(":") || part === segments[i])
    )
  })
}

/**
 * Jejak breadcrumb untuk mana-mana laluan. Ia dibina daripada setiap awalan laluan
 * yang merupakan skrin sebenar, jadi segmen yang hanya menamakan koleksi (`persons`)
 * tidak menjadi pautan ke 404. Nama circle datang daripada bootstrap yang sudah
 * dimuatkan - sifar pengambilan tambahan, dan UUID tidak pernah dipaparkan.
 *
 * Laluan yang tiada dalam `SCREENS` langsung tidak memulangkan apa-apa: breadcrumb
 * yang mereka-reka label lebih teruk daripada yang bersembunyi.
 */
export function buildCrumbs(
  pathname: string,
  circleName: (circleId: string) => string | undefined
): Crumb[] {
  const segments = pathname.split("/").filter(Boolean)
  const crumbs: Crumb[] = []

  for (let depth = 1; depth <= segments.length; depth += 1) {
    const prefix = segments.slice(0, depth)
    const screen = screenFor(prefix)
    if (!screen) {
      continue
    }

    const href = `/${prefix.join("/")}`
    const isCircle = screen.path.endsWith("/:circleId")
    crumbs.push({
      id: href,
      label: (isCircle ? circleName(prefix[depth - 1]) : undefined) ?? screen.label,
      href,
    })
  }

  return crumbs
}
