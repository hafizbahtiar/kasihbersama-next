"use client"

import { useTheme } from "@/components/theme-provider"
import { IconMoon, IconSun } from "@tabler/icons-react"

import { AccountMenu, accountInitials } from "@/components/account-menu"
import { AppBreadcrumb } from "@/components/app-breadcrumb"
import { useAuth } from "@/components/auth/auth-provider"
import { NotificationPopover } from "@/components/notifications/notification-popover"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function AppHeader() {
  const { resolvedTheme, setTheme } = useTheme()
  const { user } = useAuth()

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4 sm:px-6">
        <SidebarTrigger />
        <Separator orientation="vertical" className="my-2.5 hidden sm:block" />
        <AppBreadcrumb />

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <NotificationPopover />

          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Tukar tema"
            onPress={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
          >
            <IconSun className="hidden dark:block" />
            <IconMoon className="block dark:hidden" />
          </Button>

          <DropdownMenuTrigger>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={
                user ? `Menu akaun: ${user.displayName}` : "Menu akaun"
              }
              className="rounded-full"
            >
              <Avatar size="sm">
                <AvatarFallback>
                  {accountInitials(user?.displayName)}
                </AvatarFallback>
              </Avatar>
            </Button>
            <AccountMenu />
          </DropdownMenuTrigger>
        </div>
      </header>
    </>
  )
}
