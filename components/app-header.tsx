"use client"

import { useTheme } from "@/components/theme-provider"
import { IconMoon, IconRefresh, IconSearch, IconSun } from "@tabler/icons-react"

import { AccountMenu, accountInitials } from "@/components/account-menu"
import { AppBreadcrumb } from "@/components/app-breadcrumb"
import { useAuth } from "@/components/auth/auth-provider"
import { useCareData } from "@/components/care/care-data-provider"
import { ProfileSwitcher } from "@/components/care/profile-switcher"
import { NotificationPreview } from "@/components/notification-preview"
import {
  GlobalSearchDialog,
  useGlobalSearch,
} from "@/components/platform/global-search-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function AppHeader() {
  const { resolvedTheme, setTheme } = useTheme()
  const { user } = useAuth()
  const { isReady, isRefreshing, refresh } = useCareData()
  const { open, setOpen } = useGlobalSearch()

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4 sm:px-6">
        <SidebarTrigger />
        <Separator orientation="vertical" className="my-2.5 hidden sm:block" />
        <AppBreadcrumb />

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <ProfileSwitcher className="hidden sm:flex" />
          <button
            type="button"
            className="hidden md:block"
            onClick={() => setOpen(true)}
            aria-label="Buka carian"
          >
            <InputGroup className="h-8 w-44 cursor-pointer bg-background lg:w-56">
              <InputGroupAddon>
                <IconSearch />
              </InputGroupAddon>
              <InputGroupInput
                readOnly
                placeholder="Cari..."
                className="cursor-pointer"
              />
            </InputGroup>
          </button>

          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Cari"
            className="md:hidden"
            onPress={() => setOpen(true)}
          >
            <IconSearch />
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Segar semula"
            isDisabled={!isReady || isRefreshing}
            onPress={() => {
              void refresh()
            }}
          >
            <IconRefresh
              className={isRefreshing ? "animate-spin" : undefined}
            />
          </Button>

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

          <NotificationPreview />

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

      <GlobalSearchDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
