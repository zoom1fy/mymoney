'use client'

import { LogOut, MessageSquare, User } from 'lucide-react'
import { useState } from 'react'

import { ProfileModal } from '@/components/dashboard/profile/ProfileModal'
import { ThemeToggle } from '@/components/ui/buttons/ThemeToggle'
import { Avatar, AvatarFallback } from '@/components/ui/shadui/avatar'
import { Button } from '@/components/ui/shadui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/shadui/dropdown-menu'
import { SidebarTrigger } from '@/components/ui/shadui/sidebar'

import { useProfile } from '@/hooks/useProfile'

export function DashboardHeader() {
  const { profile, logout, isLoggingOut } = useProfile()
  const [profileOpen, setProfileOpen] = useState(false)

  const getInitials = () => {
    if (profile?.name) {
      return profile.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (profile?.email) {
      return profile.email.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background/70 backdrop-blur-sm px-4 sm:px-6">
      <SidebarTrigger className="md:hidden" />

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <Button
          className="cursor-pointer shadow-sm hover:shadow transition-all"
          size="sm"
          onClick={() => window.dispatchEvent(new Event('open-transactions'))}
        >
          <span className="hidden sm:inline">Список транзакций</span>
          <span className="sm:hidden">Транзакции</span>
        </Button>

        <Button
          className="cursor-pointer shadow-sm hover:shadow transition-all"
          size="sm"
          onClick={() => window.dispatchEvent(new Event('open-chat'))}
        >
          <MessageSquare className="size-4" />
          <span className="hidden sm:inline">ИИ помощник</span>
          <span className="sm:hidden">ИИ помощник</span>
        </Button>

        <ThemeToggle />

        {/* Dropdown меню профиля */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="relative h-8 w-8 rounded-full cursor-pointer"
              size="sm"
              variant="ghost"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            forceMount
            align="end"
            className="w-56 bg-background"
          >
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {profile?.name || 'Пользователь'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => setProfileOpen(true)}
            >
              <User className="mr-2 h-4 w-4" />
              Профиль
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              disabled={isLoggingOut}
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isLoggingOut ? 'Выход...' : 'Выйти'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ProfileModal
          open={profileOpen}
          onOpenChange={setProfileOpen}
        />
      </div>
    </header>
  )
}
