"use client"

import { useCallback, useEffect, useState } from "react"

import { getAccountRepository } from "@/lib/composition/account-repository"
import type {
  DeviceToken,
  NotificationChannel,
  ProfileNotificationPref,
  ReminderType,
} from "@/lib/domain/account"
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

function emptyState<T>(data: T): AsyncState<T> {
  return { data, isLoading: false, error: null }
}

export function useNotificationPrefs(profileId: string | undefined) {
  const [state, setState] = useState<AsyncState<ProfileNotificationPref[]>>({
    data: [],
    isLoading: Boolean(profileId),
    error: null,
  })

  const load = useCallback(async () => {
    if (!profileId) {
      setState(emptyState([]))
      return
    }
    setState((current) => ({ ...current, isLoading: true, error: null }))
    try {
      const data = await getAccountRepository().listNotificationPrefs(profileId)
      setState({ data, isLoading: false, error: null })
    } catch (cause) {
      const error = isApiError(cause)
        ? cause
        : new ApiError("Gagal memuatkan keutamaan.", {
            code: "internal",
            status: 500,
          })
      setState({ data: [], isLoading: false, error })
    }
  }, [profileId])

  useEffect(() => {
    // Load-on-mount: the loader flips isLoading synchronously before its first
    // await, which the compiler rule flags. Safe here - it is one extra render
    // on mount, and the alternative (deferring the flip) would show a stale
    // "loaded" frame first.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const updatePref = useCallback(
    async (input: {
      channel: NotificationChannel
      reminderType: ReminderType
      enabled: boolean
    }) => {
      if (!profileId) {
        return
      }
      const previous = state.data
      setState((current) => ({
        ...current,
        data: mergePref(current.data, profileId, input),
        error: null,
      }))
      try {
        const saved = await getAccountRepository().updateNotificationPref({
          careProfileId: profileId,
          ...input,
        })
        setState((current) => ({
          ...current,
          data: mergePref(current.data, profileId, {
            channel: saved.channel,
            reminderType: saved.reminderType,
            enabled: saved.enabled,
          }),
        }))
      } catch (cause) {
        setState({
          data: previous,
          isLoading: false,
          error: isApiError(cause) ? cause : null,
        })
        throw cause
      }
    },
    [profileId, state.data]
  )

  return { ...state, reload: load, updatePref }
}

function mergePref(
  prefs: ProfileNotificationPref[],
  profileId: string,
  input: {
    channel: NotificationChannel
    reminderType: ReminderType
    enabled: boolean
  }
) {
  const rest = prefs.filter(
    (item) =>
      !(
        item.careProfileId === profileId &&
        item.channel === input.channel &&
        item.reminderType === input.reminderType
      )
  )
  return [
    ...rest,
    {
      careProfileId: profileId,
      channel: input.channel,
      reminderType: input.reminderType,
      enabled: input.enabled,
      createdAt: new Date().toISOString(),
    },
  ]
}

export function prefEnabled(
  prefs: ProfileNotificationPref[],
  profileId: string,
  channel: NotificationChannel,
  reminderType: ReminderType,
  defaultEnabled = true
) {
  const match = prefs.find(
    (item) =>
      item.careProfileId === profileId &&
      item.channel === channel &&
      item.reminderType === reminderType
  )
  return match?.enabled ?? defaultEnabled
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

export function accountErrorMessage(error: ApiError | null) {
  return error ? messageForApiError(error) : null
}
