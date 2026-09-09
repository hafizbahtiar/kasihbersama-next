"use client"

import { useRouter } from "next/navigation"
import { useTheme } from "@/components/theme-provider"
import {
  IconLogout,
  IconMoon,
  IconRefresh,
  IconSearch,
  IconSun,
  IconUser,
} from "@tabler/icons-react"

import { AppBreadcrumb } from "@/components/app-breadcrumb"
import { useCareData } from "@/components/care/care-data-provider"
import { ProfileSwitcher } from "@/components/care/profile-switcher"
import { useLogout } from "@/components/logout-provider"
import { NotificationPreview } from "@/components/notification-preview"
import {
  GlobalSearchDialog,
  useGlobalSearch,
} from "@/components/platform/global-search-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function AppHeader() {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const { requestLogout } = useLogout()
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
              aria-label="Menu akaun"
              className="rounded-full"
            >
              <Avatar size="sm">
                <AvatarFallback>KB</AvatarFallback>
              </Avatar>
            </Button>
            <DropdownMenu placement="bottom end">
              <DropdownMenuLabel>Penjaga</DropdownMenuLabel>
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
          </DropdownMenuTrigger>
        </div>
      </header>

      <GlobalSearchDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
