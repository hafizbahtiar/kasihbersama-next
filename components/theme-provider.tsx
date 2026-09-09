"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react"
import { useServerInsertedHTML } from "next/navigation"

type Theme = "light" | "dark" | "system"

type ThemeContextValue = {
  theme: Theme
  resolvedTheme?: "light" | "dark"
  setTheme: (theme: string) => void
}

const STORAGE_KEY = "theme"
const ThemeContext = createContext<ThemeContextValue | null>(null)

const INIT_SCRIPT = `(function(){try{var d=document.documentElement;var t=localStorage.getItem("${STORAGE_KEY}")||"system";var r=t==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):t;d.classList.remove("light","dark");d.classList.add(r);d.style.colorScheme=r}catch(e){}})();`

function systemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function applyTheme(resolved: "light" | "dark") {
  const root = document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(resolved)
  root.style.colorScheme = resolved
}

/**
 * localStorage is the source of truth for the theme, so the provider reads it
 * through useSyncExternalStore rather than mirroring it into state from an
 * effect. setTheme writes storage then notifies; the OS media query and other
 * tabs feed the same subscription.
 */
const listeners = new Set<() => void>()

function notify() {
  for (const listener of listeners) {
    listener()
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  const media = window.matchMedia("(prefers-color-scheme: dark)")
  media.addEventListener("change", onChange)
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      onChange()
    }
  }
  window.addEventListener("storage", onStorage)

  return () => {
    listeners.delete(onChange)
    media.removeEventListener("change", onChange)
    window.removeEventListener("storage", onStorage)
  }
}

function normalizeTheme(value: string | null): Theme {
  return value === "light" || value === "dark" || value === "system"
    ? value
    : "system"
}

function readTheme(): Theme {
  try {
    return normalizeTheme(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    return "system"
  }
}

function readResolvedTheme(): "light" | "dark" {
  const theme = readTheme()
  return theme === "system" ? systemTheme() : theme
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

function ThemeHotkey() {
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) {
        return
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (event.key.toLowerCase() !== "d") {
        return
      }

      if (isTypingTarget(event.target)) {
        return
      }

      setTheme(resolvedTheme === "dark" ? "light" : "dark")
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [resolvedTheme, setTheme])

  return null
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const inserted = useRef(false)
  const theme = useSyncExternalStore(subscribe, readTheme, () => "system" as Theme)
  const resolvedTheme = useSyncExternalStore(
    subscribe,
    readResolvedTheme,
    () => "light" as const
  )

  useServerInsertedHTML(() => {
    if (inserted.current) {
      return null
    }
    inserted.current = true
    return <script dangerouslySetInnerHTML={{ __html: INIT_SCRIPT }} />
  })

  // INIT_SCRIPT already painted the right theme before hydration; this keeps
  // the DOM in sync for every change after that.
  useEffect(() => {
    applyTheme(resolvedTheme)
  }, [resolvedTheme])

  const setTheme = useCallback((next: string) => {
    const value = normalizeTheme(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // Private mode / blocked storage: the theme still applies for this page.
    }
    notify()
  }, [])

  const value = useMemo(
    () => ({ theme, setTheme, resolvedTheme }),
    [theme, setTheme, resolvedTheme]
  )

  return (
    <ThemeContext.Provider value={value}>
      <ThemeHotkey />
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme mesti dalam ThemeProvider.")
  }
  return context
}
