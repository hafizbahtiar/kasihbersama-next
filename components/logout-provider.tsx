"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { IconLogout } from "@tabler/icons-react"

import { useAuth } from "@/components/auth/auth-provider"
import { ConfirmDialog } from "@/components/confirm-dialog"

const LogoutContext = createContext<{ requestLogout: () => void } | null>(null)

export function LogoutProvider({ children }: { children: ReactNode }) {
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <LogoutContext.Provider value={{ requestLogout: () => setOpen(true) }}>
      {children}
      <ConfirmDialog
        isOpen={open}
        onOpenChange={setOpen}
        title="Log keluar?"
        description="Anda akan keluar dari akaun pada peranti ini."
        confirmLabel={isSubmitting ? "Log keluar..." : "Log keluar"}
        cancelLabel="Batal"
        variant="destructive"
        icon={<IconLogout />}
        onConfirm={async () => {
          setIsSubmitting(true)
          try {
            await logout()
          } finally {
            setIsSubmitting(false)
          }
        }}
      />
    </LogoutContext.Provider>
  )
}

export function useLogout() {
  const context = useContext(LogoutContext)
  if (!context) {
    throw new Error("useLogout mesti digunakan dalam LogoutProvider.")
  }
  return context
}
