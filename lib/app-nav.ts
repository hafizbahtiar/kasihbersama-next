import type { ComponentType, SVGProps } from "react"
import {
  IconBell,
  IconCalendarEvent,
  IconCircles,
  IconClipboardHeart,
  IconFileText,
  IconHeartbeat,
  IconHome,
  IconListCheck,
  IconPill,
  IconSettings,
  IconUsers,
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
  { href: "/appointments", title: "Temujanji", icon: IconCalendarEvent },
  { href: "/care-logs", title: "Log jagaan", icon: IconClipboardHeart },
  { href: "/vitals", title: "Bacaan vital", icon: IconHeartbeat, permission: "can_view_vitals" },
  { href: "/tasks", title: "Tugasan", icon: IconListCheck, permission: "can_manage_care_tasks" },
  {
    href: "/documents",
    title: "Dokumen",
    icon: IconFileText,
    feature: "document_upload",
    permission: "can_view_documents",
  },
]

export const secondaryNav: AppNavItem[] = [
  { href: "/notifications", title: "Notifikasi", icon: IconBell },
  { href: "/settings", title: "Tetapan", icon: IconSettings },
]

export function getAppPageTitle(pathname: string) {
  const match = [...primaryNav, ...secondaryNav].find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )
  return match?.title ?? "Laman utama"
}
