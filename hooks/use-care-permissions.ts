"use client"

import { useCareData } from "@/components/care/care-data-provider"
import type { CarePermission } from "@/lib/domain/care"

export function useCarePermissions() {
  const { selectedProfile } = useCareData()
  const permissions = selectedProfile?.permissions

  return {
    permissions,
    role: selectedProfile?.role,
    can(permission: CarePermission) {
      return Boolean(permissions?.[permission])
    },
  }
}
