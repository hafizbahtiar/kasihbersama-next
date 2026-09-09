"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { useCareData } from "@/components/care/care-data-provider"
import { CommandDialog } from "@/components/ui/command"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { primaryNav, secondaryNav } from "@/lib/app-nav"
import { IconSearch } from "@tabler/icons-react"

type SearchItem = {
  id: string
  label: string
  hint: string
  href: string
}

export function GlobalSearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const { snapshot, selectedProfile } = useCareData()
  const [query, setQuery] = useState("")

  const items = useMemo<SearchItem[]>(() => {
    const navItems = [...primaryNav, ...secondaryNav].map((item) => ({
      id: `nav-${item.href}`,
      label: item.title,
      hint: "Navigasi",
      href: item.href,
    }))

    const profileItems = snapshot.profiles.map((profile) => ({
      id: `profile-${profile.id}`,
      label: profile.displayName,
      hint: profile.relation ? `Profil · ${profile.relation}` : "Profil jagaan",
      href: `/care-profiles/${profile.id}`,
    }))

    const medicationItems = snapshot.medications
      .filter(
        (item) => !selectedProfile || item.profileId === selectedProfile.id
      )
      .slice(0, 25)
      .map((item) => ({
        id: `med-${item.id}`,
        label: item.name,
        hint: item.dosage ? `Ubat · ${item.dosage}` : "Ubat",
        href: `/medications/${item.id}`,
      }))

    return [...navItems, ...profileItems, ...medicationItems]
  }, [selectedProfile, snapshot.medications, snapshot.profiles])

  // Reset the query on close here rather than in an effect, so reopening the
  // dialog always starts empty without an extra render pass.
  const closeAndReset = useCallback(
    (next: boolean) => {
      if (!next) {
        setQuery("")
      }
      onOpenChange(next)
    },
    [onOpenChange]
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) {
      return items
    }
    return items.filter((item) =>
      `${item.label} ${item.hint}`.toLowerCase().includes(needle)
    )
  }, [items, query])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        onOpenChange(true)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onOpenChange])

  return (
    <CommandDialog
      open={open}
      onOpenChange={closeAndReset}
      title="Cari"
      description="Cari halaman, profil, dan ubat"
    >
      <div className="flex flex-col gap-2 p-2">
        <InputGroup className="h-9">
          <InputGroupAddon>
            <IconSearch />
          </InputGroupAddon>
          <InputGroupInput
            autoFocus
            placeholder="Cari halaman, profil, ubat..."
            value={query}
            onChange={(event) =>
              setQuery(
                typeof event === "string" ? event : event.target.value
              )
            }
          />
        </InputGroup>
        <div className="max-h-72 overflow-y-auto rounded-lg border">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Tiada hasil dijumpai.
            </p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => {
                  closeAndReset(false)
                  router.push(item.href)
                }}
              >
                <span className="truncate font-medium">{item.label}</span>
                <span className="ml-auto truncate text-xs text-muted-foreground">
                  {item.hint}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </CommandDialog>
  )
}

export function useGlobalSearch() {
  const [open, setOpen] = useState(false)
  return { open, setOpen }
}
