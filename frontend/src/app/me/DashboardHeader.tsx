'use client'

import { Button } from '@/components/ui/shadui/button'
import { SidebarTrigger } from '@/components/ui/shadui/sidebar'

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background/70 backdrop-blur-sm px-6">
      <SidebarTrigger className="md:hidden" />

      <div className="ml-auto flex items-center gap-4">
        <Button
          size="sm"
          className="cursor-pointer"
          onClick={() => window.dispatchEvent(new Event('open-transactions'))}
        >
          Список транзакций
        </Button>
      </div>
    </header>
  )
}
