"use client"

import { useSyncExternalStore } from "react"

/** The values below never change after hydration, so nothing to subscribe to. */
const noopSubscribe = () => () => {}

/**
 * Reads a browser-only value (URL fragment, localStorage, …) without the
 * setState-in-effect round trip that triggers a cascading render.
 *
 * `read` must be pure and return a referentially stable value (a primitive, or
 * a cached object) - React calls it on every render and loops if the result
 * changes identity. `serverValue` is what SSR and the hydration render see.
 */
export function useBrowserValue<T>(read: () => T, serverValue: T) {
  return useSyncExternalStore(noopSubscribe, read, () => serverValue)
}
