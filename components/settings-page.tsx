"use client"

import { useState } from "react"
import {
  IconBell,
  IconDatabase,
  IconDeviceMobile,
  IconLock,
  IconLogout,
  IconUser,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { useAuth } from "@/components/auth/auth-provider"
import { AsyncStateBanner } from "@/components/care/async-state"
import { ResendVerificationButton } from "@/components/auth/resend-verification-button"
import { useCareProfile } from "@/components/care/care-data-provider"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useLogout } from "@/components/logout-provider"
import { PushPermissionHint } from "@/components/notifications/push-onboarding"
import {
  DeleteAccountCard,
  ExportAccountCard,
} from "@/components/settings/danger-zone"
import {
  ChangeEmailCard,
  ChangePasswordCard,
} from "@/components/settings/security-section"
import { SessionsCard } from "@/components/settings/sessions-section"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, LinkButton } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  prefEnabled,
  useDeviceTokens,
  useNotificationPrefs,
} from "@/hooks/use-account-data"
import { formatDateTime } from "@/lib/application/care-format"
import { fieldValue } from "@/lib/application/form-value"
import {
  PLATFORM_LABELS,
  PUSH_ENABLED_REMINDER_TYPES,
  REMINDER_TYPE_LABELS,
} from "@/lib/domain/account"
import { cn } from "@/lib/utils"

const settingsNav = [
  { id: "account", label: "Akaun", icon: IconUser },
  { id: "security", label: "Keselamatan", icon: IconLock },
  { id: "data", label: "Data & akaun", icon: IconDatabase },
  { id: "notifications", label: "Pemberitahuan", icon: IconBell },
  { id: "devices", label: "Peranti", icon: IconDeviceMobile },
  { id: "session", label: "Sesi", icon: IconLogout },
] as const

type SettingsSection = (typeof settingsNav)[number]["id"]

export function SettingsPage() {
  const { user, updateDisplayName, logoutAll } = useAuth()
  const { requestLogout } = useLogout()
  const { selectedProfile, profiles, setSelectedProfileId } = useCareProfile()
  const [section, setSection] = useState<SettingsSection>("account")
  const [displayName, setDisplayName] = useState(user?.displayName ?? "")
  const [savingAccount, setSavingAccount] = useState(false)
  const [logoutAllOpen, setLogoutAllOpen] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null)

  const notificationPrefs = useNotificationPrefs(selectedProfile?.id)
  const devices = useDeviceTokens()

  const current = settingsNav.find((item) => item.id === section)
  const medicationPushEnabled = selectedProfile
    ? prefEnabled(
        notificationPrefs.data,
        selectedProfile.id,
        "push",
        "medication"
      )
    : true

  async function saveAccount() {
    setSavingAccount(true)
    try {
      await updateDisplayName(displayName)
    } finally {
      setSavingAccount(false)
    }
  }

  async function toggleMedicationPush(enabled: boolean) {
    if (!selectedProfile) {
      return
    }
    try {
      await notificationPrefs.updatePref({
        channel: "push",
        reminderType: "medication",
        enabled,
      })
      toast.success("Keutamaan disimpan.")
    } catch {
      // Error toast handled by auth/account layer where applicable.
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl tracking-tight">Tetapan</h1>
        <p className="text-sm text-muted-foreground">
          Urus akaun, peringatan dan peranti anda.
        </p>
      </div>

      <div className="flex flex-col gap-5 md:flex-row md:items-start">
        <aside className="w-full shrink-0 md:sticky md:top-4 md:w-56">
          <nav
            aria-label="Bahagian tetapan"
            className="flex flex-col gap-1 rounded-xl bg-card p-2 ring-1 ring-foreground/10"
          >
            {settingsNav.map((item) => {
              const active = item.id === section
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2 px-3 font-normal",
                    active
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground"
                  )}
                  onPress={() => setSection(item.id)}
                >
                  <item.icon />
                  {item.label}
                </Button>
              )
            })}
          </nav>
        </aside>

        <section
          className="min-w-0 flex-1"
          aria-labelledby="settings-section-title"
        >
          <h2 id="settings-section-title" className="sr-only">
            {current?.label}
          </h2>

          {section === "account" ? (
            <div className="flex flex-col gap-4">
              <Card>
                <CardContent className="flex items-center gap-4">
                  <Avatar className="size-14">
                    <AvatarFallback className="text-base">
                      {(user?.displayName ?? "KB").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-heading text-lg leading-tight">
                        {user?.displayName ?? "Pengguna"}
                      </p>
                      {/* A user that has not loaded yet is unknown, not
                          unverified - rendering the negative badge for null
                          states a fact we do not have. */}
                      {user ? (
                        <Badge
                          variant={user.emailVerified ? "secondary" : "outline"}
                        >
                          {user.emailVerified
                            ? "E-mel disahkan"
                            : "E-mel belum disahkan"}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {user?.email ?? "-"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {user && !user.emailVerified ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Sahkan e-mel</CardTitle>
                    <CardDescription>
                      Akaun anda belum disahkan. Sahkan e-mel untuk akses penuh.
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="flex-wrap justify-end gap-2">
                    <LinkButton href="/verify-email" variant="outline">
                      Saya ada token
                    </LinkButton>
                    <ResendVerificationButton />
                  </CardFooter>
                </Card>
              ) : null}

              <Card>
                <CardHeader>
                  <CardTitle>Akaun</CardTitle>
                  <CardDescription>
                    Nama paparan diselaraskan dengan `GET/PATCH /me`.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="display-name">
                        Nama paparan
                      </FieldLabel>
                      <Input
                        id="display-name"
                        value={displayName}
                        onChange={(event) => setDisplayName(fieldValue(event))}
                        size="xl"
                        className="bg-background"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="email">E-mel</FieldLabel>
                      <Input
                        id="email"
                        type="email"
                        value={user?.email ?? ""}
                        readOnly
                        size="xl"
                        className="bg-muted"
                      />
                      <FieldDescription>
                        Tukar e-mel di bahagian Keselamatan.
                      </FieldDescription>
                    </Field>
                  </FieldGroup>
                </CardContent>
                <CardFooter className="justify-end">
                  <Button
                    onPress={() => {
                      void saveAccount()
                    }}
                    isDisabled={savingAccount || !displayName.trim()}
                  >
                    {savingAccount ? "Menyimpan..." : "Simpan akaun"}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ) : null}

          {section === "security" ? (
            <div className="flex flex-col gap-4">
              <ChangePasswordCard />
              <ChangeEmailCard />
            </div>
          ) : null}

          {section === "data" ? (
            <div className="flex flex-col gap-4">
              <ExportAccountCard />
              <DeleteAccountCard />
            </div>
          ) : null}

          {section === "notifications" ? (
            <Card>
              <CardHeader>
                <CardTitle>Pemberitahuan</CardTitle>
                <CardDescription>
                  Keutamaan dikaitkan dengan profil jagaan aktif.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <AsyncStateBanner
                  error={notificationPrefs.error}
                  onRetry={() => {
                    void notificationPrefs.reload()
                  }}
                  label="Gagal memuatkan keutamaan."
                />

                <Field>
                  <FieldLabel>Profil jagaan</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {profiles.map((profile) => (
                      <Button
                        key={profile.id}
                        size="sm"
                        variant={
                          profile.id === selectedProfile?.id
                            ? "default"
                            : "outline"
                        }
                        onPress={() => setSelectedProfileId(profile.id)}
                      >
                        {profile.displayName}
                      </Button>
                    ))}
                  </div>
                </Field>

                <PushPermissionHint />

                {notificationPrefs.isLoading ? (
                  <Skeleton className="h-24 w-full" />
                ) : (
                  <FieldGroup>
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>
                          {REMINDER_TYPE_LABELS.medication} (push)
                        </FieldTitle>
                        <FieldDescription>
                          Satu-satunya push aktif pada backend hari ini.
                        </FieldDescription>
                      </FieldContent>
                      <Switch
                        aria-label="Peringatan ubat push"
                        isSelected={medicationPushEnabled}
                        isDisabled={
                          !selectedProfile || notificationPrefs.isLoading
                        }
                        onChange={(value) => {
                          void toggleMedicationPush(value)
                        }}
                      />
                    </Field>

                    {(["appointment", "task"] as const).map((type) => (
                      <Field key={type} orientation="horizontal">
                        <FieldContent>
                          <FieldTitle>
                            {REMINDER_TYPE_LABELS[type]} (push)
                          </FieldTitle>
                          <FieldDescription>
                            Push belum dihantar oleh backend - tetapan akan
                            tersedia apabila saluran diaktifkan.
                          </FieldDescription>
                        </FieldContent>
                        <Switch
                          aria-label={`${REMINDER_TYPE_LABELS[type]} push`}
                          isSelected={false}
                          isDisabled
                        />
                      </Field>
                    ))}
                  </FieldGroup>
                )}

                <p className="text-xs text-muted-foreground">
                  Saluran push aktif: {PUSH_ENABLED_REMINDER_TYPES.join(", ")}.
                  Profil tanpa baris keutamaan dianggap opted-in (lalai
                  backend).
                </p>
              </CardContent>
            </Card>
          ) : null}

          {section === "devices" ? (
            <Card>
              <CardHeader>
                <CardTitle>Peranti</CardTitle>
                <CardDescription>
                  Peranti iOS/Android yang menerima push melalui subscription
                  id.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AsyncStateBanner
                  error={devices.error}
                  onRetry={() => {
                    void devices.reload()
                  }}
                  label="Gagal memuatkan senarai peranti."
                />

                {devices.isLoading ? (
                  <Skeleton className="h-24 w-full" />
                ) : devices.data.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Tiada peranti didaftarkan. Daftar melalui aplikasi mudah
                    alih Kasih Bersama.
                  </p>
                ) : (
                  <ItemGroup className="gap-3">
                    {devices.data.map((device) => (
                      <Item key={device.id} variant="muted">
                        <ItemMedia variant="icon">
                          <IconDeviceMobile />
                        </ItemMedia>
                        <ItemContent>
                          <ItemTitle>
                            {PLATFORM_LABELS[device.platform]}
                          </ItemTitle>
                          <ItemDescription>
                            {device.subscriptionId.slice(0, 18)}… ·{" "}
                            {formatDateTime(device.createdAt)}
                          </ItemDescription>
                        </ItemContent>
                        <ItemActions>
                          <Button
                            variant="outline"
                            size="sm"
                            onPress={() => setRevokeTarget(device.id)}
                          >
                            Keluarkan
                          </Button>
                        </ItemActions>
                      </Item>
                    ))}
                  </ItemGroup>
                )}
              </CardContent>
            </Card>
          ) : null}

          {section === "session" ? (
            <div className="flex flex-col gap-4">
              <SessionsCard />

              <Card>
                <CardHeader>
                  <CardTitle>Log keluar</CardTitle>
                  <CardDescription>
                    Keluar dari peranti ini, atau tamatkan semua sesi sekali
                    gus.
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex-wrap justify-end gap-2">
                  <Button variant="outline" onPress={requestLogout}>
                    <IconLogout />
                    Log keluar
                  </Button>
                  <Button
                    variant="destructive"
                    onPress={() => setLogoutAllOpen(true)}
                  >
                    Log keluar semua peranti
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ) : null}
        </section>
      </div>

      <ConfirmDialog
        isOpen={logoutAllOpen}
        onOpenChange={setLogoutAllOpen}
        title="Log keluar semua peranti?"
        description="Semua refresh token akan dibatalkan. Anda perlu log masuk semula di setiap peranti."
        confirmLabel="Log keluar semua"
        variant="destructive"
        icon={<IconLogout />}
        onConfirm={() => {
          void logoutAll()
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(revokeTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRevokeTarget(null)
          }
        }}
        title="Keluarkan peranti?"
        description="Peranti ini tidak lagi menerima push sehingga didaftarkan semula."
        confirmLabel="Keluarkan"
        variant="destructive"
        onConfirm={() => {
          if (!revokeTarget) {
            return
          }
          void devices.revoke(revokeTarget).then(() => {
            toast.success("Peranti dikeluarkan.")
            setRevokeTarget(null)
          })
        }}
      />
    </div>
  )
}
