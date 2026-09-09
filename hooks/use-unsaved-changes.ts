"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export function useUnsavedChangesGuard(enabled: boolean) {
  const [open, setOpen] = useState(false)
  const enabledRef = useRef(enabled)
  const bypassRef = useRef(false)
  const proceedRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    enabledRef.current = enabled
  })

  const requestLeave = useCallback((leave: () => void) => {
    if (!enabledRef.current || bypassRef.current) {
      leave()
      return
    }

    proceedRef.current = leave
    setOpen(true)
  }, [])

  const confirmLeave = useCallback(() => {
    bypassRef.current = true
    setOpen(false)
    const leave = proceedRef.current
    proceedRef.current = null
    leave?.()
  }, [])

  const cancelLeave = useCallback(() => {
    setOpen(false)
    proceedRef.current = null
  }, [])

  useEffect(() => {
    if (!enabled) {
      bypassRef.current = false
      return
    }

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", onBeforeUnload)
    window.history.pushState({ unsavedGuard: true }, "", window.location.href)

    const onPopState = () => {
      if (bypassRef.current || !enabledRef.current) {
        return
      }

      window.history.pushState({ unsavedGuard: true }, "", window.location.href)
      proceedRef.current = () => {
        bypassRef.current = true
        window.history.go(-2)
      }
      setOpen(true)
    }

    window.addEventListener("popstate", onPopState)

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload)
      window.removeEventListener("popstate", onPopState)
    }
  }, [enabled])

  return {
    open,
    setOpen,
    requestLeave,
    confirmLeave,
    cancelLeave,
  }
}
