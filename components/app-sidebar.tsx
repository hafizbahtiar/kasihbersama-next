"use client"

import { useMemo } from "react"
import { usePathname } from "next/navigation"
import { IconDotsVertical } from "@tabler/icons-react"

import { AccountMenu, accountInitials } from "@/components/account-menu"
import { useAuth } from "@/components/auth/auth-provider"
import { LogoMark } from "@/components/brand/logo-mark"
import { ProfileSwitcher } from "@/components/care/profile-switcher"
import { useCareData } from "@/components/care/care-data-provider"
import { usePlatform } from "@/components/platform/platform-provider"
import { useCarePermissions } from "@/hooks/use-care-permissions"
import { primaryNav, secondaryNav } from "@/lib/app-nav"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"

function isNavActive(pathname: string, href: string) {
  if (href === "/home") {
    return pathname === "/home"
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { state } = useSidebar()
  const collapsed = state === "collapsed"
  const { isFeatureEnabled } = usePlatform()
  const { can } = useCarePermissions()
  const { selectedProfile } = useCareData()

  const visiblePrimaryNav = useMemo(
    () =>
      primaryNav.filter((item) => {
        if (item.feature && !isFeatureEnabled(item.feature)) {
          return false
        }
        if (item.permission && selectedProfile && !can(item.permission)) {
          return false
        }
        return true
      }),
    [can, isFeatureEnabled, selectedProfile]
  )

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              href="/home"
              tooltip="Kasih Bersama"
              className="group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white p-1 ring-1 ring-border dark:bg-white">
                <LogoMark className="size-full" decorative />
              </span>
              <span className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium">Kasih Bersama</span>
                <span className="truncate text-xs text-muted-foreground">
                  Ruang penjagaan
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/*
          The only other ProfileSwitcher is in the header at `hidden sm:flex`,
          so on a phone there was no way to choose or even see the active
          profile - while every care form depends on one and told the user to
          "pilih profil jagaan di header". The sidebar exists at every width.
        */}
        <div className="px-1 pt-1 group-data-[collapsible=icon]:hidden">
          <ProfileSwitcher className="w-full" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Jagaan</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visiblePrimaryNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    href={item.href}
                    isActive={isNavActive(pathname, item.href)}
                    tooltip={item.title}
                    className="group-data-[collapsible=icon]:justify-center"
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Akaun</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    href={item.href}
                    isActive={isNavActive(pathname, item.href)}
                    tooltip={item.title}
                    className="group-data-[collapsible=icon]:justify-center"
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="group-data-[collapsible=icon]:mx-0" />

      {/*
        The footer is the account menu, not a logout button.

        It used to be a single button wired straight to requestLogout, labelled
        "Penjaga" over a hardcoded "KB" - so the one slot where every user
        looks for "who am I / edit my details" showed neither, and pressing it
        signed you out. Now it names the signed-in account and opens the same
        menu as the header avatar.
      */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenuTrigger>
              {/*
                No `tooltip` here on purpose: it makes SidebarMenuButton render
                a TooltipTrigger around the button, and nesting that inside the
                menu trigger puts two react-aria ButtonContext providers on one
                button. The collapsed rail shows the initials, and the menu
                names the account when opened.
              */}
              <SidebarMenuButton
                size="lg"
                aria-label={`Menu akaun: ${user?.displayName ?? "Pengguna"}`}
                className="group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!"
              >
                <Avatar size="sm" className="size-6">
                  <AvatarFallback>
                    {accountInitials(user?.displayName)}
                  </AvatarFallback>
                </Avatar>
                <span className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate">
                    {user?.displayName ?? "Pengguna"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.email ?? "Akaun"}
                  </span>
                </span>
                <IconDotsVertical className="ml-auto group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
              <AccountMenu
                placement={collapsed ? "right bottom" : "top start"}
              />
            </DropdownMenuTrigger>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
