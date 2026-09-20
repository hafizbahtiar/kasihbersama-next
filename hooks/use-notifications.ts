"use client"

import { useCallback, useEffect, useState } from "react"

import { getNotificationRepository } from "@/lib/composition/notification-repository"
import type { AppNotification } from "@/lib/domain/notification"
import { ApiError, isApiError } from "@/lib/infrastructure/api/errors"

/**
 * The inbox, one cursor page at a time.
 *
 * Pages append rather than replace: the list is ordered newest-first and only
 * grows at the head, so "load more" is the only movement a reader sees.
 */
export function useNotifications() {
  const [data, setData] = useState<AppNotification[]>([])
  const [cursor, setCursor] = useState<string | undefined>()
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const asApiError = (cause: unknown) =>
    isApiError(cause)
      ? cause
      : new ApiError("Gagal memuatkan pemberitahuan.", {
          code: "internal",
          status: 500,
        })

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const page = await getNotificationRepository().inbox()
      setData(page.data)
      setCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } catch (cause) {
      setError(asApiError(cause))
      setData([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Load-on-mount: the loader flips isLoading synchronously before its first
    // await, which the compiler rule flags. Safe here - it is one extra render
    // on mount, and the alternative (deferring the flip) would show a stale
    // "loaded" frame first.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const loadMore = useCallback(async () => {
    if (!cursor) {
      return
    }
    setIsLoading(true)
    try {
      const page = await getNotificationRepository().inbox(cursor)
      setData((current) => [...current, ...page.data])
      setCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } catch (cause) {
      setError(asApiError(cause))
    } finally {
      setIsLoading(false)
    }
  }, [cursor])

  // Both writes are idempotent server-side, and the row is patched in place
  // rather than reloaded: a reload would re-fetch every page the reader opened.
  const markRead = useCallback(async (id: string) => {
    await getNotificationRepository().markRead(id)
    const readAt = new Date().toISOString()
    setData((current) =>
      current.map((n) => (n.id === id ? { ...n, readAt: n.readAt ?? readAt } : n))
    )
  }, [])

  const acknowledge = useCallback(async (id: string) => {
    await getNotificationRepository().acknowledge(id)
    const at = new Date().toISOString()
    setData((current) =>
      current.map((n) =>
        n.id === id
          ? { ...n, readAt: n.readAt ?? at, acknowledgedAt: n.acknowledgedAt ?? at }
          : n
      )
    )
  }, [])

  return {
    data,
    isLoading,
    error,
    hasMore,
    reload: load,
    loadMore,
    markRead,
    acknowledge,
  }
}
