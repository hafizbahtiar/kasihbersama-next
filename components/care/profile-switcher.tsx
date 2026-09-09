"use client"

import { IconUsers } from "@tabler/icons-react"

import { useCareData } from "@/components/care/care-data-provider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function ProfileSwitcher({ className }: { className?: string }) {
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
      selectedKey={selectedProfileId}
      onSelectionChange={(key) => {
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
          <SelectItem key={profile.id} id={profile.id} textValue={profile.displayName}>
            {profile.displayName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
