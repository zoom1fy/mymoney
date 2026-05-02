'use client'

import { MessageSquare } from 'lucide-react'

import { Button } from '@/components/ui/shadui/button'
import { SidebarTrigger } from '@/components/ui/shadui/sidebar'

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background/70 backdrop-blur-sm px-4 sm:px-6">
      <SidebarTrigger className="md:hidden" />

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <Button
          size="sm"
          className="cursor-pointer shadow-sm hover:shadow transition-all"
          onClick={() => window.dispatchEvent(new Event('open-transactions'))}
        >
          <span className="hidden sm:inline">Список транзакций</span>
          <span className="sm:hidden">Транзакции</span>
        </Button>

        <Button
          size="sm"
          className="cursor-pointer shadow-sm hover:shadow transition-all"
          onClick={() => window.dispatchEvent(new Event('open-chat'))}
        >
          <MessageSquare className="size-4" />
          <span className="hidden sm:inline">ИИ помощник</span>
          <span className="sm:hidden">ИИ помощник</span>
        </Button>
      </div>
    </header>
  )
}
