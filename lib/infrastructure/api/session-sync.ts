const CHANNEL_NAME = "kb-session"
const STORAGE_EVENT_KEY = "kb-session-event"

export type SessionEvent = "signed-in" | "signed-out"

function canUseDom() {
  return typeof window !== "undefined"
}

function emit(event: SessionEvent) {
  if (!canUseDom()) {
    return
  }
  window.localStorage.setItem(STORAGE_EVENT_KEY, event)
  window.localStorage.removeItem(STORAGE_EVENT_KEY)
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME)
    channel.postMessage(event)
    channel.close()
  } catch {
    // BroadcastChannel unavailable in some environments.
  }
}

export const sessionSync = {
  notifySignedIn() {
    emit("signed-in")
  },

  notifySignedOut() {
    emit("signed-out")
  },

  subscribe(listener: (event: SessionEvent) => void) {
    if (!canUseDom()) {
      return () => undefined
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_EVENT_KEY || !event.newValue) {
        return
      }
      if (event.newValue === "signed-in" || event.newValue === "signed-out") {
        listener(event.newValue)
      }
    }

    let channel: BroadcastChannel | undefined
    const onMessage = (event: MessageEvent<SessionEvent>) => {
      if (event.data === "signed-in" || event.data === "signed-out") {
        listener(event.data)
      }
    }

    window.addEventListener("storage", onStorage)
    try {
      channel = new BroadcastChannel(CHANNEL_NAME)
      channel.addEventListener("message", onMessage)
    } catch {
      channel = undefined
    }

    return () => {
      window.removeEventListener("storage", onStorage)
      channel?.removeEventListener("message", onMessage)
      channel?.close()
    }
  },
}
