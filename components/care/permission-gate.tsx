"use client"

import type { ReactNode } from "react"

import { usePlatform } from "@/components/platform/platform-provider"
import { useCarePermissions } from "@/hooks/use-care-permissions"
import type { CarePermission } from "@/lib/domain/care"
import type { PlatformFeature } from "@/lib/domain/platform"

type PermissionGateProps = {
  permission?: CarePermission
  feature?: PlatformFeature
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGate({
  permission,
  feature,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { can } = useCarePermissions()
  const { isFeatureEnabled } = usePlatform()

  if (feature && !isFeatureEnabled(feature)) {
    return fallback
  }
  if (permission && !can(permission)) {
    return fallback
  }

  return children
}
