"use client"

import { useCallback, useEffect, useState } from "react"

import { getAccountRepository } from "@/lib/composition/account-repository"
import type {
  AuthDevice,
  DeviceToken,
  NotificationPreferences,
  NotificationPreferencesPatch,
  UserSession,
} from "@/lib/domain/account"
import { EMPTY_NOTIFICATION_PREFERENCES } from "@/lib/domain/account"
import {
  ApiError,
  isApiError,
  messageForApiError,
} from "@/lib/infrastructure/api/errors"

type AsyncState<T> = {
  data: T
  isLoading: boolean
  error: ApiError | null
}

export function useNotificationPreferences() {
  const [state, setState] = useState<AsyncState<NotificationPreferences>>({
    data: EMPTY_NOTIFICATION_PREFERENCES,
    isLoading: true,
    error: null,
  })
  const [isSaving, setIsSaving] = useState(false)

  const load = useCallback(async () => {
    setState((current) => ({ ...current, isLoading: true, error: null }))
    try {
      const data = await getAccountRepository().getNotificationPreferences()
      setState({ data, isLoading: false, error: null })
    } catch (cause) {
      const error = isApiError(cause)
        ? cause
        : new ApiError("Gagal memuatkan keutamaan.", {
            code: "internal",
            status: 500,
          })
      setState({
        data: EMPTY_NOTIFICATION_PREFERENCES,
        isLoading: false,
        error,
      })
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

  /**
   * No optimistic write: the server answers with the full preferences, and a
   * refused switch (a mandatory category) has to snap back anyway. Rendering
   * only what the server returned keeps one authority instead of two.
   */
  const save = useCallback(async (patch: NotificationPreferencesPatch) => {
    setIsSaving(true)
    try {
      const data =
        await getAccountRepository().updateNotificationPreferences(patch)
      setState({ data, isLoading: false, error: null })
    } finally {
      setIsSaving(false)
    }
  }, [])

  return { ...state, isSaving, reload: load, save }
}

export function useDeviceTokens() {
  const [state, setState] = useState<AsyncState<DeviceToken[]>>({
    data: [],
    isLoading: true,
    error: null,
  })

  const load = useCallback(async () => {
    setState((current) => ({ ...current, isLoading: true, error: null }))
    try {
      const data = await getAccountRepository().listDeviceTokens()
      setState({ data, isLoading: false, error: null })
    } catch (cause) {
      const error = isApiError(cause)
        ? cause
        : new ApiError("Gagal memuatkan peranti.", {
            code: "internal",
            status: 500,
          })
      setState({ data: [], isLoading: false, error })
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

  const revoke = useCallback(
    async (tokenId: string) => {
      await getAccountRepository().revokeDeviceToken(tokenId)
      await load()
    },
    [load]
  )

  return { ...state, reload: load, revoke }
}

export function useSessions() {
  const [state, setState] = useState<AsyncState<UserSession[]>>({
    data: [],
    isLoading: true,
    error: null,
  })

  const load = useCallback(async () => {
    setState((current) => ({ ...current, isLoading: true, error: null }))
    try {
      const data = await getAccountRepository().listSessions()
      setState({ data, isLoading: false, error: null })
    } catch (cause) {
      const error = isApiError(cause)
        ? cause
        : new ApiError("Gagal memuatkan sesi.", {
            code: "internal",
            status: 500,
          })
      setState({ data: [], isLoading: false, error })
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

  const revoke = useCallback(
    async (sessionId: string) => {
      await getAccountRepository().revokeSession(sessionId)
      await load()
    },
    [load]
  )

  return { ...state, reload: load, revoke }
}

export function useAuthDevices() {
  const [state, setState] = useState<AsyncState<AuthDevice[]>>({
    data: [],
    isLoading: true,
    error: null,
  })

  const load = useCallback(async () => {
    setState((current) => ({ ...current, isLoading: true, error: null }))
    try {
      const data = await getAccountRepository().listDevices()
      setState({ data, isLoading: false, error: null })
    } catch (cause) {
      const error = isApiError(cause)
        ? cause
        : new ApiError("Gagal memuatkan peranti.", {
            code: "internal",
            status: 500,
          })
      setState({ data: [], isLoading: false, error })
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

  const revoke = useCallback(
    async (deviceId: string) => {
      await getAccountRepository().revokeDevice(deviceId)
      await load()
    },
    [load]
  )

  // Trust only ever moves false->true (the backend has no untrust route), so
  // the reload is what refreshes the badge and the trusted_at timestamp.
  const trust = useCallback(
    async (deviceId: string) => {
      await getAccountRepository().trustDevice(deviceId)
      await load()
    },
    [load]
  )

  return { ...state, reload: load, revoke, trust }
}

export function accountErrorMessage(error: ApiError | null) {
  return error ? messageForApiError(error) : null
}
