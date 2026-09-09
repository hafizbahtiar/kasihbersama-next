"use client"

import { useMemo } from "react"
import Link from "next/link"
import {
  IconCalendarEvent,
  IconHeartbeat,
  IconListCheck,
  IconPill,
  IconUsers,
} from "@tabler/icons-react"

import { useCareData } from "@/components/care/care-data-provider"
import { TodayDosesCard } from "@/components/care/today-doses-card"
import {
  numericChartConfig,
  pressureChartConfig,
  toNumericChartData,
  toPressureChartData,
  VitalChartWidget,
} from "@/components/care/vital-chart-widget"
import {
  CaregiverModeBanner,
  PlatformFeaturesSection,
  PlatformQuotaBanner,
} from "@/components/platform/platform-features-section"
import { usePlatform } from "@/components/platform/platform-provider"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { buildDashboardStats } from "@/lib/application/dashboard-stats"

export function DashboardPage() {
  const { snapshot, selectedProfile, isRefreshing, loadError } = useCareData()
  const { limits } = usePlatform()

  const stats = useMemo(
    () => buildDashboardStats(snapshot, selectedProfile?.id),
    [selectedProfile?.id, snapshot]
  )

  const vitals = useMemo(
    () =>
      snapshot.vitals.filter((item) => item.profileId === selectedProfile?.id),
    [selectedProfile?.id, snapshot.vitals]
  )

  const memberCount = useMemo(() => {
    if (!selectedProfile) {
      return undefined
    }
    return snapshot.members.filter(
      (item) =>
        item.profileId === selectedProfile.id && item.status === "active"
    ).length
  }, [selectedProfile, snapshot.members])

  const cards = [
    {
      title: "Profil jagaan",
      href: "/care-profiles",
      value: String(stats.profileCount),
      hint: `Had percuma: ${limits.maxProfilesFree} profil`,
      icon: IconUsers,
    },
    {
      title: "Ubat aktif",
      href: "/medications",
      value: String(stats.activeMedicationCount),
      hint: selectedProfile
        ? `Untuk ${selectedProfile.displayName}`
        : "Pilih profil untuk statistik khusus",
      icon: IconPill,
    },
    {
      title: "Temujanji",
      href: "/appointments",
      value: String(stats.upcomingAppointmentCount),
      hint: "Belum selesai",
      icon: IconCalendarEvent,
    },
    {
      title: "Tugasan terbuka",
      href: "/tasks",
      value: String(stats.openTaskCount),
      hint: "Perlu tindakan",
      icon: IconListCheck,
    },
    {
      title: "Bacaan vital",
      href: "/vitals",
      value: stats.latestVital,
      hint: selectedProfile
        ? `Tekanan darah ${selectedProfile.displayName}`
        : "Tekanan darah terkini",
      icon: IconHeartbeat,
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl tracking-tight">Laman utama</h1>
        <p className="text-sm text-muted-foreground">
          {selectedProfile
            ? `Ringkasan penjagaan untuk ${selectedProfile.displayName}.`
            : "Pilih profil jagaan untuk melihat statistik khusus."}
          {isRefreshing ? " Memuatkan data..." : null}
          {loadError ? ` ${loadError}` : null}
        </p>
      </div>

      <CaregiverModeBanner />
      <PlatformQuotaBanner
        profileCount={stats.profileCount}
        memberCount={memberCount}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {cards.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Card className="h-full transition-colors hover:border-ring/40 hover:bg-muted/40">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardDescription>{item.title}</CardDescription>
                    <CardTitle className="font-heading text-2xl">
                      {item.value}
                    </CardTitle>
                  </div>
                  <item.icon className="size-5 text-muted-foreground" />
                </div>
                <CardDescription>{item.hint}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <TodayDosesCard />

      <div className="grid gap-4 xl:grid-cols-2">
        <VitalChartWidget
          title="Tekanan darah"
          description={
            selectedProfile
              ? `Trend sistolik dan diastolik untuk ${selectedProfile.displayName}.`
              : "Pilih profil untuk melihat trend."
          }
          data={toPressureChartData(vitals)}
          config={pressureChartConfig}
          series={[
            { dataKey: "systolic", color: "var(--color-systolic)" },
            { dataKey: "diastolic", color: "var(--color-diastolic)" },
          ]}
        />
        <VitalChartWidget
          title="Gula darah"
          description="mmol/L merentasi bacaan terakhir."
          data={toNumericChartData(vitals, "blood_glucose")}
          config={numericChartConfig}
          series={[{ dataKey: "value", color: "var(--color-value)" }]}
        />
      </div>

      <PlatformFeaturesSection />
    </div>
  )
}
