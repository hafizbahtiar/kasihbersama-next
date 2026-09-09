import { AuthGate } from "@/components/auth/auth-gate"
import { AppHeader } from "@/components/app-header"
import { AppSidebar } from "@/components/app-sidebar"
import { AppMain } from "@/components/care/app-main"
import { CareDataProvider } from "@/components/care/care-data-provider"
import { ForceUpdateGate } from "@/components/platform/force-update-gate"
import { PlatformProvider } from "@/components/platform/platform-provider"
import { LogoutProvider } from "@/components/logout-provider"
import { ResourceSnapshotProvider } from "@/components/resource-snapshot-provider"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { createResourceSnapshot } from "@/lib/application/resource-snapshot"
import { isMockDataEnabled } from "@/lib/infrastructure/config"
import { getCareRepository } from "@/lib/composition/care-repository"
import { getResourceRepository } from "@/lib/composition/resource-repository"
import { emptyCareSnapshot } from "@/lib/domain/care-snapshot"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const mockMode = isMockDataEnabled()
  const resourceSnapshot = mockMode
    ? await createResourceSnapshot(getResourceRepository())
    : null
  const careSnapshot = mockMode
    ? await getCareRepository().getSnapshot()
    : emptyCareSnapshot()

  return (
    <AuthGate>
      <PlatformProvider>
        <ForceUpdateGate>
          <ResourceSnapshotProvider snapshot={resourceSnapshot}>
            <CareDataProvider initialSnapshot={careSnapshot}>
              <LogoutProvider>
                <SidebarProvider>
                  <AppSidebar />
                  <SidebarInset className="min-w-0 overflow-x-hidden">
                    <AppHeader />
                    <AppMain>{children}</AppMain>
                  </SidebarInset>
                </SidebarProvider>
              </LogoutProvider>
            </CareDataProvider>
          </ResourceSnapshotProvider>
        </ForceUpdateGate>
      </PlatformProvider>
    </AuthGate>
  )
}
