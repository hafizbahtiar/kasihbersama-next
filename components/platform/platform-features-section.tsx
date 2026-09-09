"use client"

import {
  IconAlertTriangle,
  IconFileDescription,
  IconHeartHandshake,
  IconHistory,
} from "@tabler/icons-react"

import Link from "next/link"

import { PermissionGate } from "@/components/care/permission-gate"
import { usePlatform } from "@/components/platform/platform-provider"
import { useAccountUsage } from "@/hooks/use-account-usage"
import { LinkButton } from "@/components/ui/button"
import { planDisplayName } from "@/lib/domain/platform"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const platformCards = [
  {
    id: "emergency",
    title: "Kad kecemasan",
    description: "Paparan pantas maklumat kritikal semasa kecemasan.",
    icon: IconAlertTriangle,
    permission: "can_view_emergency_card" as const,
    endpointAvailable: true,
    href: "/emergency-card",
  },
  {
    id: "doctor_summary",
    title: "Ringkasan doktor",
    description: "Kumpulkan rekod satu tempoh untuk dibawa ke temujanji.",
    icon: IconFileDescription,
    feature: "doctor_summary" as const,
    permission: "can_export_summary" as const,
    endpointAvailable: true,
    href: "/summaries",
  },
  {
    id: "audit",
    title: "Audit & sejarah",
    description: "Jejak perubahan dan aktiviti profil jagaan.",
    icon: IconHistory,
    permission: "can_change_roles" as const,
    endpointAvailable: true,
    href: "/care-profiles",
  },
] as const

export function PlatformFeaturesSection() {
  const { isFeatureEnabled } = usePlatform()

  const visibleCards = platformCards.filter((item) => {
    if ("feature" in item && item.feature && !isFeatureEnabled(item.feature)) {
      return false
    }
    return true
  })

  if (visibleCards.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h2 className="font-heading text-lg tracking-tight">Platform</h2>
        <p className="text-sm text-muted-foreground">
          Ciri lanjutan mengikut konfigurasi server dan kebenaran profil.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visibleCards.map((item) => {
          const body = (
            <Card key={item.id} className="h-full">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardDescription>{item.title}</CardDescription>
                    <CardTitle className="text-base font-medium">
                      {item.endpointAvailable
                        ? "Tersedia"
                        : "Belum disambungkan"}
                    </CardTitle>
                  </div>
                  <item.icon className="size-5 text-muted-foreground" />
                </div>
                <CardDescription>{item.description}</CardDescription>
                {!item.endpointAvailable ? (
                  <Badge variant="secondary">
                    Endpoint backend belum tersedia
                  </Badge>
                ) : null}
              </CardHeader>
            </Card>
          )

          // A card that says "Tersedia" and does nothing when clicked is worse
          // than one that says it is unavailable: it promises a destination.
          const card =
            "href" in item && item.href && item.endpointAvailable ? (
              <Link
                key={item.id}
                href={item.href}
                className="block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {body}
              </Link>
            ) : (
              body
            )

          if ("permission" in item && item.permission) {
            return (
              <PermissionGate key={item.id} permission={item.permission}>
                {card}
              </PermissionGate>
            )
          }

          return card
        })}
      </div>
    </div>
  )
}

export function CaregiverModeBanner() {
  const { isFeatureEnabled } = usePlatform()

  if (!isFeatureEnabled("caregiver_mode")) {
    return null
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4 text-sm">
      <IconHeartHandshake className="mt-0.5 size-5 shrink-0 text-primary" />
      <div className="space-y-1">
        <p className="font-medium">Mod penjaga aktif</p>
        <p className="text-muted-foreground">
          Antara muka diselaraskan untuk aliran kerja penjaga harian.
        </p>
      </div>
    </div>
  )
}

export function PlatformQuotaBanner({
  selectedProfileId,
}: {
  /** When set, member seats for this profile are read from /me/usage. */
  selectedProfileId?: string
}) {
  const { usage } = useAccountUsage()
  const { plan } = usePlatform()

  if (!usage) {
    return null
  }

  const memberUsed = selectedProfileId
    ? usage.members.find((row) => row.careProfileId === selectedProfileId)
        ?.used
    : undefined

  const profileNearLimit =
    usage.profiles.used >= usage.limits.maxProfiles
  const memberNearLimit =
    memberUsed != null && memberUsed >= usage.limits.maxMembers

  if (!profileNearLimit && !memberNearLimit) {
    return null
  }

  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
      <p className="font-medium">Had pelan {planDisplayName(plan ?? usage.plan)}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
        <li>
          Profil jagaan: {usage.profiles.used}/{usage.limits.maxProfiles}
        </li>
        {memberUsed != null ? (
          <li>
            Ahli profil: {memberUsed}/{usage.limits.maxMembers}
          </li>
        ) : null}
        <li>Had muat naik fail: {usage.limits.maxUploadMb} MB setiap satu</li>
      </ul>
      <LinkButton variant="link" size="sm" href="/pricing/usage" className="mt-3 h-auto p-0">
        Lihat penggunaan penuh
      </LinkButton>
    </div>
  )
}
