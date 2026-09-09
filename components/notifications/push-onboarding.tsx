"use client"

import { IconBellRinging, IconDeviceMobile } from "@tabler/icons-react"

import { Button, LinkButton } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const PUSH_ONBOARDING_KEY = "kb-push-onboarding-dismissed"

export function isPushOnboardingDismissed() {
  if (typeof window === "undefined") {
    return true
  }
  return window.localStorage.getItem(PUSH_ONBOARDING_KEY) === "1"
}

export function dismissPushOnboarding() {
  window.localStorage.setItem(PUSH_ONBOARDING_KEY, "1")
}

export function PushOnboardingBanner({
  onDismiss,
}: {
  onDismiss?: () => void
}) {
  function dismiss() {
    dismissPushOnboarding()
    onDismiss?.()
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <IconBellRinging className="size-5 text-primary" />
          Peringatan push pada telefon
        </CardTitle>
        <CardDescription>
          Backend hari ini hantar push ubat ke aplikasi iOS/Android sahaja. Web
          boleh urus keutamaan, tetapi pendaftaran peranti push memerlukan
          aplikasi mudah alih.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onPress={dismiss}>
          Faham
        </Button>
        <LinkButton href="/settings" size="sm">
          <IconDeviceMobile />
          Tetapan peranti
        </LinkButton>
      </CardContent>
    </Card>
  )
}

export function PushPermissionHint() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null
  }

  const permission = Notification.permission

  if (permission === "granted") {
    return (
      <p className="text-sm text-muted-foreground">
        Keizinan pelayar dibenarkan, tetapi push ubat masih dihantar melalui
        aplikasi mudah alih.
      </p>
    )
  }

  if (permission === "denied") {
    return (
      <p className="text-sm text-muted-foreground">
        Keizinan pelayar ditolak. Anda masih boleh urus keutamaan di sini; untuk
        menerima push sebenar, gunakan aplikasi iOS/Android.
      </p>
    )
  }

  return (
    <p className="text-sm text-muted-foreground">
      Pelayar web belum meminta keizinan notifikasi. Push ubat aktif pada
      aplikasi mudah alih.
    </p>
  )
}
