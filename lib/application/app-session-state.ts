const SELECTED_PROFILE_KEY = "kb-selected-profile"

export function clearAppSessionState() {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.removeItem(SELECTED_PROFILE_KEY)
}
