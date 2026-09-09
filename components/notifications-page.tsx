"use client"

import { useState } from "react"
import { SelectProfileEmpty } from "@/components/care/select-profile-empty"
import { IconBell, IconHeadset, IconSettings } from "@tabler/icons-react"

import { AsyncStateBanner } from "@/components/care/async-state"
import { useCareProfile } from "@/components/care/care-data-provider"
import { useBrowserValue } from "@/hooks/use-browser-value"
import {
  PushOnboardingBanner,
  isPushOnboardingDismissed,
} from "@/components/notifications/push-onboarding"
import { LinkButton } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  accountErrorMessage,
  prefEnabled,
  useNotificationPrefs,
} from "@/hooks/use-account-data"
import { REMINDER_TYPE_LABELS } from "@/lib/domain/account"

export function NotificationsPage() {
  const { selectedProfile } = useCareProfile()
  const prefs = useNotificationPrefs(selectedProfile?.id)
  // Read on the client only: SSR renders the banner hidden, so a returning
  // user who already dismissed it never sees it flash in.
  const previouslyDismissed = useBrowserValue(isPushOnboardingDismissed, true)
  const [dismissedNow, setDismissedNow] = useState(false)
  const showOnboarding = !previouslyDismissed && !dismissedNow

  const medicationEnabled = selectedProfile
    ? prefEnabled(prefs.data, selectedProfile.id, "push", "medication")
    : true

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl tracking-tight">Notifikasi</h1>
        <p className="text-sm text-muted-foreground">
          Pilih peringatan mana anda mahu terima.
        </p>
      </div>

      {showOnboarding ? (
        <PushOnboardingBanner onDismiss={() => setDismissedNow(true)} />
      ) : null}

      <Tabs defaultSelectedKey="user" className="gap-5">
        <TabsList>
          <TabsTrigger id="user">
            <IconBell data-icon="inline-start" />
            Keutamaan
          </TabsTrigger>
          <TabsTrigger id="admin">
            <IconHeadset data-icon="inline-start" />
            Admin
          </TabsTrigger>
        </TabsList>

        <TabsContent id="user">
          <Card>
            <CardHeader>
              <CardTitle>Keutamaan penjaga</CardTitle>
              <CardDescription>
                Tiada API inbox/notifikasi disimpan. Peringatan dihantar terus
                melalui push/e-mel mengikut keutamaan profil.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AsyncStateBanner
                error={prefs.error}
                onRetry={() => {
                  void prefs.reload()
                }}
              />

              {selectedProfile ? (
                <div className="rounded-xl border bg-muted/30 p-4 text-sm">
                  <p className="font-medium">{selectedProfile.displayName}</p>
                  <p className="text-muted-foreground">
                    {REMINDER_TYPE_LABELS.medication} (push):{" "}
                    {medicationEnabled ? "Aktif" : "Mati"}
                  </p>
                </div>
              ) : (
                <SelectProfileEmpty />
              )}

              {accountErrorMessage(prefs.error) ? null : (
                <LinkButton href="/settings">
                  <IconSettings />
                  Urus di tetapan
                </LinkButton>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent id="admin">
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>Pengumuman admin</CardTitle>
              <CardDescription>
                Endpoint backend untuk inbox/admin broadcast belum tersedia.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                UI mock sebelum ini telah digantikan. Apabila API disediakan,
                halaman ini akan memaparkan senarai pengumuman dan borang hantar
                pengumuman.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
