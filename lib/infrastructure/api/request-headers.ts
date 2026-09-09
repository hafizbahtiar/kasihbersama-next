import {
  getApiVersion,
  getAppBuild,
  getAppPlatform,
} from "@/lib/composition/config"

export function applyDefaultApiHeaders(headers: Headers) {
  headers.set("X-App-Build", String(getAppBuild()))
  headers.set("X-App-Platform", getAppPlatform())
  headers.set("X-API-Version", getApiVersion())
}
