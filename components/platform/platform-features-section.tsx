"use client"

import {
  IconAlertTriangle,
  IconFileDescription,
  IconHeartHandshake,
  IconHistory,
} from "@tabler/icons-react"

import { PermissionGate } from "@/components/care/permission-gate"
import { usePlatform } from "@/components/platform/platform-provider"
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
    endpointAvailable: false,
  },
  {
    id: "doctor_summary",
    title: "Ringkasan doktor",
    description: "Eksport ringkasan perubatan untuk temujanji.",
    icon: IconFileDescription,
    feature: "doctor_summary" as const,
    permission: "can_export_summary" as const,
    endpointAvailable: false,
  },
  {
    id: "audit",
    title: "Audit & sejarah",
    description: "Jejak perubahan dan aktiviti profil jagaan.",
    icon: IconHistory,
    endpointAvailable: false,
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
          const card = (
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
                  <Badge variant="secondary">Endpoint backend belum tersedia</Badge>
                ) : null}
              </CardHeader>
            </Card>
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
  profileCount,
  memberCount,
}: {
  profileCount: number
  memberCount?: number
}) {
  const { limits } = usePlatform()

  const profileNearLimit = profileCount >= limits.maxProfilesFree
  const memberNearLimit =
    memberCount != null && memberCount >= limits.maxMembersFree

  if (!profileNearLimit && !memberNearLimit) {
    return null
  }

  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
      <p className="font-medium">Had pelan percuma</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
        <li>
          Profil jagaan: {profileCount}/{limits.maxProfilesFree}
        </li>
        {memberCount != null ? (
          <li>
            Ahli profil: {memberCount}/{limits.maxMembersFree}
          </li>
        ) : null}
        <li>Had muat naik fail: {limits.maxUploadMb} MB</li>
      </ul>
    </div>
  )
}
