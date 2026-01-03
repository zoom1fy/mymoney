import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/shadui/sidebar'

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background/70 backdrop-blur-sm px-6">
          {/* Только триггер — он сам рисует гамбургер */}
          <SidebarTrigger className="md:hidden" />

          {/* Разделитель и будущие элементы (поиск, уведомления и т.д.) */}
          <div className="ml-auto flex items-center gap-4">
            {/* Здесь позже можно добавить аватар пользователя, уведомления и т.д. */}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}