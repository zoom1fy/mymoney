'use client'

import { cn } from '@/lib/utils'
import { accountService } from '@/services/account.service'
import { useQuery } from '@tanstack/react-query'
import { Plus, Wallet } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Avatar, AvatarFallback } from '@/components/ui/shadui/avatar'
import { Button } from '@/components/ui/shadui/button'
import { ScrollArea } from '@/components/ui/shadui/scroll-area'
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
  SidebarSeparator
} from '@/components/ui/shadui/sidebar'

import {
  AccountCategoryNameMap,
  AccountIcons,
  CurrencyCode
} from '@/types/account.types'

const currencySymbols: Record<CurrencyCode, string> = {
  [CurrencyCode.RUB]: '₽',
  [CurrencyCode.USD]: '$',
  [CurrencyCode.EUR]: '€',
  [CurrencyCode.BTC]: '₿'
}

export function DashboardSidebar() {
  const pathname = usePathname()

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountService.getAll(),
    staleTime: 1000 * 60 // 1 минута
  })

  // Группировка по категориям
  const groupedAccounts = accounts.reduce(
    (acc, account) => {
      const category = account.categoryId
      if (!acc[category]) acc[category] = []
      acc[category].push(account)
      return acc
    },
    {} as Record<number, typeof accounts>
  )

  const IconComponent = (iconName?: string) => {
    if (!iconName || !AccountIcons[iconName]) return Wallet
    return AccountIcons[iconName]
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border/50 bg-background/70 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-5">
          <div className="rounded-full bg-accent/20 p-3">
            <Wallet className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">MyMoney</h2>
            <p className="text-sm text-muted-foreground">Личный кабинет</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <ScrollArea className="flex-1 px-3 py-2">
          {Object.entries(groupedAccounts).map(([categoryId, accounts]) => {
            const categoryName =
              AccountCategoryNameMap[
                Number(categoryId) as keyof typeof AccountCategoryNameMap
              ]

            return (
              <SidebarGroup
                key={categoryId}
                className="py-2"
              >
                <SidebarGroupLabel className="px-3 text-base font-semibold text-foreground/80">
                  {categoryName + 'ы'}
                </SidebarGroupLabel>
                <SidebarGroupContent className="grid gap-2 mt-2">
                  {accounts.map(account => {
                    const Icon = IconComponent(account.icon)
                    const symbol = currencySymbols[account.currencyCode]

                    return (
                      <Link
                        key={account.id}
                        href={`/dashboard/accounts/${account.id}`}
                        className={cn(
                          'block rounded-xl border bg-card/40 backdrop-blur-sm p-4 transition-all',
                          'hover:bg-card/70 hover:shadow-md hover:border-accent/30',
                          pathname === `/dashboard/accounts/${account.id}` &&
                            'ring-2 ring-accent/50 bg-card/60 border-accent/40'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-accent/10 p-2.5">
                            <Icon className="h-6 w-6 text-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            {' '}
                            {/* min-w-0 для обрезки текста */}
                            <p className="font-medium text-base truncate">
                              {account.name}
                            </p>
                            <p className="text-lg font-bold text-foreground mt-0.5">
                              {account.currentBalance.toLocaleString('ru-RU')}{' '}
                              {symbol}
                            </p>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </SidebarGroupContent>
              </SidebarGroup>
            )
          })}

          {isLoading && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Загрузка счетов...
            </div>
          )}

          {accounts.length === 0 && !isLoading && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Пока нет счетов
            </div>
          )}
        </ScrollArea>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="border-t border-border/50 bg-background/70 backdrop-blur-sm">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/dashboard/accounts/new">
                <Plus className="h-5 w-5" />
                <span>Добавить счёт</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
