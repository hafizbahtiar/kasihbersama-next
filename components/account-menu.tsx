"use client"

import { useRouter } from "next/navigation"
import { IconLogout, IconStethoscope, IconUser } from "@tabler/icons-react"

import { useAuth } from "@/components/auth/auth-provider"
import { useLogout } from "@/components/logout-provider"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

type MenuPlacement = React.ComponentProps<typeof DropdownMenu>["placement"]

/**
 * Initials for the avatar fallback.
 *
 * The header and the sidebar both showed a literal "KB" with the label
 * "Penjaga" - the app's own initials and the word for "carer" - so a signed-in
 * person never saw who they were signed in as. On an app where one person
 * routinely holds accounts for a parent and for themselves, that is the one
 * thing the account menu exists to answer.
 */
export function accountInitials(displayName: string | undefined) {
  const words = (displayName ?? "").trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) {
    return "??"
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

/**
 * The account menu itself, shared by the header avatar and the sidebar footer
 * so the two cannot drift into offering different actions.
 *
 * Wrap it in your own `DropdownMenuTrigger` with whatever trigger suits the
 * surface.
 */
export function AccountMenu({
  placement = "bottom end",
}: {
  placement?: MenuPlacement
}) {
  const router = useRouter()
  const { user } = useAuth()
  const { requestLogout } = useLogout()

  return (
    <DropdownMenu placement={placement} className="min-w-56">
      {/*
        DropdownMenuLabel, not a <div>: this renders inside a react-aria Menu,
        which is a collection. A plain element in a collection is not a valid
        node, and the whole menu fails to render rather than just that line -
        clicking the trigger did nothing at all.
      */}
      <DropdownMenuLabel className="py-1.5">
        <span className="block truncate text-sm font-medium text-foreground">
          {user?.displayName ?? "Pengguna"}
        </span>
        {user?.email ? (
          <span className="block truncate text-xs font-normal">
            {user.email}
          </span>
        ) : null}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onAction={() => router.push("/settings")}>
        <IconUser />
        Profil & tetapan
      </DropdownMenuItem>
      <DropdownMenuItem onAction={() => router.push("/my-health")}>
        <IconStethoscope />
        Kesihatan saya
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onAction={requestLogout}>
        <IconLogout />
        Log keluar
      </DropdownMenuItem>
    </DropdownMenu>
  )
}
