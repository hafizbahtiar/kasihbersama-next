"use client"

import type { ReactNode } from "react"

import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

type ResponsiveDialogProps = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  /** Buttons. Rendered in the dialog's footer bar, or the drawer's. */
  footer?: ReactNode
  className?: string
}

/**
 * One dialog that is a centred modal on a desktop and a bottom sheet on a
 * phone.
 *
 * A centred modal on a small screen puts the form under the keyboard and above
 * the thumb; a sheet does neither. Since every form in this app can be opened
 * on either, the choice belongs here and not in each caller - a caller that
 * has to remember it is a caller that will forget.
 *
 * It carries no form logic on purpose: `children` is the form, and the caller
 * owns submit, validation and busy state.
 */
export function ResponsiveDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onOpenChange} showSwipeHandle>
        <DrawerContent className={className}>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            {description ? (
              <DrawerDescription>{description}</DrawerDescription>
            ) : null}
          </DrawerHeader>
          {/* Boleh ditatal: borang yang lebih tinggi daripada sheet mesti masih
              boleh dicapai bila papan kekunci naik. */}
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            {children}
          </div>
          {footer ? <DrawerFooter>{footer}</DrawerFooter> : null}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      className={cn("sm:max-w-lg", className)}
    >
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description ? (
          <DialogDescription>{description}</DialogDescription>
        ) : null}
      </DialogHeader>
      <div className="space-y-4">{children}</div>
      {footer ? <DialogFooter>{footer}</DialogFooter> : null}
    </Dialog>
  )
}
