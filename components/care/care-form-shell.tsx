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
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes"

export function CareFormShell({
  title,
  description,
  backHref,
  dirty,
  submitLabel = "Cipta",
  onSubmit,
  onSubmitAndContinue,
  isDisabled,
  children,
}: {
  title: string
  /** One short line saying what to fill in. Not a paragraph. */
  description?: string
  backHref: string
  dirty: boolean
  submitLabel?: string
  /**
   * Optional second action that saves and stays, for the forms people fill
   * repeatedly - two readings, three log entries. Without it, recording twice
   * meant two full round trips out to the list page and back in.
   */
  onSubmitAndContinue?: () => void
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
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>{children}</CardContent>
        <CardFooter className="flex-wrap justify-end gap-2">
          <BackButton appearance="action" onPress={goBack} />
          {onSubmitAndContinue ? (
            <Button
              variant="outline"
              isDisabled={isDisabled}
              onPress={onSubmitAndContinue}
            >
              Simpan dan tambah lagi
            </Button>
          ) : null}
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
