import { AuthGate } from "@/components/auth/auth-gate"
import { AppHeader } from "@/components/app-header"
import { AppSidebar } from "@/components/app-sidebar"
import { AppMain } from "@/components/shared/app-main"
import { ForceUpdateGate } from "@/components/platform/force-update-gate"
import { PlatformProvider } from "@/components/platform/platform-provider"
import { LogoutProvider } from "@/components/logout-provider"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { DisplayPreferencesProvider } from "@/lib/application/display-preferences"

// Cangkerang app. Ia tidak lagi memuatkan data semasa render: penyedia care dan
// resource v0.1 dibuang bersama modulnya, dan modul v0.2 memuatkan datanya sendiri
// bila skrinnya dibuka.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <DisplayPreferencesProvider>
        <PlatformProvider>
          <ForceUpdateGate>
            <LogoutProvider>
              <SidebarProvider>
                <AppSidebar />
                <SidebarInset className="min-w-0 overflow-x-hidden">
                  <AppHeader />
                  <AppMain>{children}</AppMain>
                </SidebarInset>
              </SidebarProvider>
            </LogoutProvider>
          </ForceUpdateGate>
        </PlatformProvider>
      </DisplayPreferencesProvider>
    </AuthGate>
  )
}
