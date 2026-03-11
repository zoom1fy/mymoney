import { DashboardHeader } from './DashboardHeader'

import { DashboardSidebar } from '@/components/dashboard/sidebar/DashboardSidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/shadui/sidebar'

export const metadata = {
  title: 'Дашборд'
}

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <DashboardSidebar />

      <SidebarInset>
        <DashboardHeader />

        <main className="flex-1 overflow-y-auto p-6 lg:p-10">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
