import { getAppPlatform } from "@/lib/infrastructure/config"

const INSTALL_ID_KEY = "kb-install-id"

/**
 * The platforms the backend's `deviceDTO` accepts (enum on the login body).
 * `NEXT_PUBLIC_APP_PLATFORM` is free-form, so anything outside the set would be
 * rejected by validation - fall back to `web` rather than sending it.
 */
const DEVICE_PLATFORMS = ["ios", "android", "web", "desktop", "unknown"]

export type DeviceDescriptor = {
  install_id: string
  platform: string
  name: string
}

function readOrCreateInstallId() {
  try {
    const existing = window.localStorage.getItem(INSTALL_ID_KEY)
    if (existing) {
      return existing
    }
    // Available in any secure context, which includes every deployment and
    // localhost. The fallback is for plain-HTTP origins on a LAN, where the
    // list of devices simply has to keep working.
    const created =
      globalThis.crypto?.randomUUID?.() ??
      `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    window.localStorage.setItem(INSTALL_ID_KEY, created)
    return created
  } catch {
    // Private mode with storage disabled: no stable id, so no device row.
    return ""
  }
}

/**
 * A short "browser · OS" label, so two browsers on one account are
 * distinguishable in the devices list. A guess from the UA string on purpose:
 * there is no API that answers this, and a wrong guess is only a label.
 */
function describeBrowser(ua: string) {
  const browser = [
    [/Edg\//, "Edge"],
    [/OPR\//, "Opera"],
    [/Firefox\//, "Firefox"],
    [/Chrome\//, "Chrome"],
    [/Safari\//, "Safari"],
  ].find(([pattern]) => (pattern as RegExp).test(ua))?.[1]

  const os = [
    [/Windows/, "Windows"],
    [/Android/, "Android"],
    [/iPhone|iPad/, "iOS"],
    [/Mac OS X/, "macOS"],
    [/Linux/, "Linux"],
  ].find(([pattern]) => (pattern as RegExp).test(ua))?.[1]

  const label = [browser, os].filter(Boolean).join(" · ")
  return label || "Pelayar web"
}

/**
 * What this browser reports itself as on login. The backend only creates a
 * device row when `install_id` is present, so without this the devices list
 * stays empty forever - and a trusted device could never skip MFA.
 *
 * Returns undefined on the server, where there is no browser to identify.
 */
export function currentDevice(): DeviceDescriptor | undefined {
  if (typeof window === "undefined") {
    return undefined
  }
  const installId = readOrCreateInstallId()
  if (!installId) {
    return undefined
  }
  const platform = getAppPlatform()
  return {
    install_id: installId,
    platform: DEVICE_PLATFORMS.includes(platform) ? platform : "web",
    name: describeBrowser(window.navigator.userAgent),
  }
}
