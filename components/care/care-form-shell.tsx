"use client"

import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { IconAlertTriangle } from "@tabler/icons-react"

import { BackButton } from "@/components/back-button"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes"

export function CareFormShell({
  title,
  backHref,
  dirty,
  submitLabel = "Cipta",
  onSubmit,
  isDisabled,
  children,
}: {
  title: string
  backHref: string
  dirty: boolean
  submitLabel?: string
  onSubmit: () => void
  isDisabled?: boolean
  children: ReactNode
}) {
  const router = useRouter()
  const { open, setOpen, requestLeave, confirmLeave, cancelLeave } =
    useUnsavedChangesGuard(dirty)

  function goBack() {
    requestLeave(() => router.push(backHref))
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <BackButton onPress={goBack} />
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
        <CardFooter className="justify-end gap-2">
          <BackButton appearance="action" onPress={goBack} />
          <Button isDisabled={isDisabled} onPress={onSubmit}>
            {submitLabel}
          </Button>
        </CardFooter>
      </Card>
      <ConfirmDialog
        isOpen={open}
        onOpenChange={(nextOpen) => {
          if (nextOpen) {
            setOpen(true)
            return
          }
          cancelLeave()
        }}
        title="Buang perubahan?"
        description="Anda sudah mula sunting. Jika keluar sekarang, perubahan ini tidak disimpan."
        confirmLabel="Keluar"
        cancelLabel="Teruskan sunting"
        variant="destructive"
        icon={<IconAlertTriangle />}
        onConfirm={confirmLeave}
      />
    </div>
  )
}
