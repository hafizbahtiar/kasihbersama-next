"use client"

import { IconUsers } from "@tabler/icons-react"

import { useAuth } from "@/components/auth/auth-provider"
import { useCareData } from "@/components/care/care-data-provider"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { isOwnHealthProfile } from "@/lib/domain/care"
import { cn } from "@/lib/utils"

export function ProfileSwitcher({ className }: { className?: string }) {
  const { user } = useAuth()
  const { snapshot, selectedProfileId, setSelectedProfileId, isReady } =
    useCareData()
  const profiles = snapshot.profiles.filter((item) => item.status === "active")

  if (profiles.length === 0) {
    return null
  }

  if (!isReady) {
    return (
      <Skeleton
        className={cn("hidden h-8 w-[11.5rem] sm:block sm:w-52", className)}
      />
    )
  }

  return (
    <Select
      className={className}
      value={selectedProfileId}
      onChange={(key) => {
        if (typeof key === "string") {
          setSelectedProfileId(key)
        }
      }}
      aria-label="Profil jagaan"
    >
      <SelectTrigger className="h-8 w-[11.5rem] bg-background sm:w-52">
        <IconUsers data-icon="inline-start" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {profiles.map((profile) => (
          <SelectItem
            key={profile.id}
            id={profile.id}
            textValue={profile.displayName}
          >
            {profile.displayName}
            {/* Your own health record is a care profile like any other, so
                without this it sits in the list under your own name looking
                exactly like one of the people you look after. */}
            {isOwnHealthProfile(profile, user?.id) ? (
              <Badge variant="secondary">Saya</Badge>
            ) : null}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
