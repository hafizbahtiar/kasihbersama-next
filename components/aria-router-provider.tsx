"use client"

import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { RouterProvider } from "react-aria-components"

/**
 * Connects react-aria-components to the Next.js router.
 *
 * Every link in this app - the sidebar nav, breadcrumbs, LinkButton - renders
 * a react-aria-components `Link`, not a `next/link`. Without a RouterProvider
 * those fall back to the browser's own navigation, so each click reloaded the
 * whole document: the bundle re-downloaded, the session bootstrapped again,
 * and the care snapshot refetched all eleven requests.
 *
 * With it, react-aria intercepts the click and hands the href to the router,
 * which is the client-side navigation the App Router is built for - only the
 * changed segment re-renders, and the providers above it stay mounted.
 */
export function AriaRouterProvider({ children }: { children: ReactNode }) {
  const router = useRouter()

  return <RouterProvider navigate={router.push}>{children}</RouterProvider>
}
