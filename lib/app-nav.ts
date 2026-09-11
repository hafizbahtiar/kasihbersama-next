import type { ComponentType, SVGProps } from "react"
import {
  IconAlertTriangle,
  IconBell,
  IconCalendarEvent,
  IconChartBar,
  IconCircles,
  IconClipboardHeart,
  IconFileDescription,
  IconFileText,
  IconHeartbeat,
  IconHome,
  IconListCheck,
  IconPill,
  IconReceipt,
  IconSettings,
  IconStethoscope,
  IconUsers,
  IconChartLine,
  IconProgressCheck,
  IconVaccine,
} from "@tabler/icons-react"

import type { CarePermission } from "@/lib/domain/care"
import type { PlatformFeature } from "@/lib/domain/platform"

export type AppNavIcon = ComponentType<SVGProps<SVGSVGElement>>

export type AppNavItem = {
  href: string
  title: string
  icon: AppNavIcon
  feature?: PlatformFeature
  permission?: CarePermission
}

export const primaryNav: AppNavItem[] = [
  { href: "/home", title: "Laman utama", icon: IconHome },
  { href: "/care-profiles", title: "Profil jagaan", icon: IconUsers },
  { href: "/circles", title: "Kumpulan", icon: IconCircles },
  { href: "/medications", title: "Ubat", icon: IconPill },
  {
    href: "/growth",
    title: "Carta tumbesaran",
    icon: IconChartLine,
    permission: "can_view_timeline",
    // Hidden while the feature is off. The route answers 404 in that state,
    // which the client can only render as "Rekod tidak dijumpai" - a message
    // that describes neither the cause nor anything the user can do.
    feature: "growth_chart",
  },
  {
    href: "/milestones",
    title: "Perkembangan",
    icon: IconProgressCheck,
    permission: "can_view_timeline",
  },
  {
    href: "/immunisations",
    title: "Imunisasi",
    icon: IconVaccine,
    permission: "can_view_timeline",
  },
  { href: "/appointments", title: "Temujanji", icon: IconCalendarEvent },
  { href: "/care-logs", title: "Log jagaan", icon: IconClipboardHeart },
  {
    href: "/vitals",
    title: "Bacaan vital",
    icon: IconHeartbeat,
    permission: "can_view_vitals",
  },
  {
    href: "/tasks",
    title: "Tugasan",
    icon: IconListCheck,
    permission: "can_manage_care_tasks",
  },
  {
    href: "/emergency-card",
    title: "Kad kecemasan",
    icon: IconAlertTriangle,
    permission: "can_view_emergency_card",
  },
  {
    href: "/summaries",
    title: "Ringkasan doktor",
    icon: IconFileDescription,
    feature: "doctor_summary",
    permission: "can_export_summary",
  },
  {
    href: "/documents",
    title: "Dokumen",
    icon: IconFileText,
    feature: "document_upload",
    permission: "can_view_documents",
  },
]

export const secondaryNav: AppNavItem[] = [
  // Under "Akaun" rather than "Jagaan": this is the user's own record, not
  // one of the people they look after.
  { href: "/my-health", title: "Kesihatan saya", icon: IconStethoscope },
  { href: "/notifications", title: "Notifikasi", icon: IconBell },
  { href: "/pricing", title: "Pelan", icon: IconReceipt },
  { href: "/pricing/usage", title: "Penggunaan", icon: IconChartBar },
  { href: "/settings", title: "Tetapan", icon: IconSettings },
]

const allNavItems = [...primaryNav, ...secondaryNav]

/** Longest matching href wins so /pricing/usage does not also light up /pricing. */
export function isNavActive(pathname: string, href: string) {
  if (href === "/home") {
    return pathname === "/home"
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
