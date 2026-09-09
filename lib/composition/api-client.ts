import { getApiBaseUrl } from "@/lib/composition/config"
import {
  createApiClient,
  getApiClient,
  resetApiClient,
} from "@/lib/infrastructure/api/client"

export function ensureApiClient() {
  return getApiClient(getApiBaseUrl())
}

export function recreateApiClient() {
  resetApiClient()
  return createApiClient(getApiBaseUrl())
}
