"use client"

import { useRouter } from "next/navigation"
import { IconLogout, IconUser } from "@tabler/icons-react"

import { useAuth } from "@/components/auth/auth-provider"
import { useLogout } from "@/components/logout-provider"
import {
  DropdownMenu,
  DropdownMenuItem,
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
      <div className="px-1.5 py-1.5">
        <p className="truncate text-sm font-medium">
          {user?.displayName ?? "Pengguna"}
        </p>
        {user?.email ? (
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        ) : null}
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem onAction={() => router.push("/settings")}>
        <IconUser />
        Profil & tetapan
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onAction={requestLogout}>
        <IconLogout />
        Log keluar
      </DropdownMenuItem>
    </DropdownMenu>
  )
}
