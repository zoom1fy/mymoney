import { DashboardHeader } from '@/app/me/header'
import { DashboardProvider } from '@/components/dashboard/dashboard-provider'
import { DashboardSidebar } from '@/components/dashboard/sidebar/dashboard-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/shadui/sidebar'

// Shared chrome for all dashboard routes; used by /me layout and by the
// desktop root page so the app opens straight into the dashboard
export function DashboardShell({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardProvider>
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset>
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto p-6 lg:p-10">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </DashboardProvider>
  )
}
