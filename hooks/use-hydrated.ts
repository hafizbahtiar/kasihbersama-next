"use client"

import { useSyncExternalStore } from "react"

/** No-op subscribe: the hydrated flag flips once and never changes again. */
const subscribe = () => () => {}

/**
 * False during SSR and the hydration render, true afterwards. Used to gate
 * markup that depends on browser-only state (URL fragments, storage) so the
 * server and client render the same tree.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
}
