'use client'

import { ScrollArea } from '../ui/shadui/scroll-area'
import { CreateAccountModal } from './CreateAccountModal'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Plus, Wallet } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

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
  AccountCategoryEnum,
  AccountCategoryNameMap,
  AccountIcons,
  CurrencyCode,
  IAccount
} from '@/types/account.types'

import { useAccounts } from '@/hooks/useAccounts'

const currencySymbols: Record<CurrencyCode, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  BTC: '₿'
}

export function DashboardSidebar() {
  const { accounts, isLoading } = useAccounts()
  const pathname = usePathname()

  const ACCOUNT_CATEGORIES: AccountCategoryEnum[] = [
    AccountCategoryEnum.ACCOUNTS,
    AccountCategoryEnum.SAVINGS
  ]

  // Группировка по категориям
  const groupedAccounts = accounts.reduce<
    Record<AccountCategoryEnum, IAccount[]>
  >(
    (acc, account) => {
      const category = account.categoryId

      acc[category].push(account)
      return acc
    },
    {
      [AccountCategoryEnum.ACCOUNTS]: [],
      [AccountCategoryEnum.SAVINGS]: []
    }
  )

  const IconComponent = (iconName?: string) =>
    AccountIcons[iconName || 'Wallet'] || Wallet

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border/50 bg-background/70 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-5">
          <div className="rounded-full bg-accent/20 p-3">
            <Wallet className="size-6 text-accent" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">MyMoney</h2>
            <p className="text-sm text-muted-foreground">Личный кабинет</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <ScrollArea className="flex-1 px-3 py-2">
          {ACCOUNT_CATEGORIES.map(category => {
            const accountsInCategory = groupedAccounts[category]

            if (!accountsInCategory || accountsInCategory.length === 0)
              return null

            const categoryName = AccountCategoryNameMap[category]

            return (
              <SidebarGroup
                key={category}
                className="py-2"
              >
                <SidebarGroupLabel className="px-3 text-base font-semibold text-foreground/80">
                  {categoryName}
                </SidebarGroupLabel>

                <SidebarGroupContent className="grid gap-3 mt-2">
                  {accountsInCategory.map(account => {
                    const Icon = IconComponent(account.icon)
                    const symbol = currencySymbols[account.currencyCode]
                    const isActive =
                      pathname === `/dashboard/accounts/${account.id}`

                    return (
                      <CreateAccountModal
                        key={account.id}
                        mode="edit"
                        account={account}
                        trigger={
                          <div
                            className={cn(
                              'group relative overflow-hidden rounded-2xl',
                              'border border-border/40 bg-card/40 backdrop-blur-xl',
                              'transition-all duration-500 ease-out',
                              'cursor-pointer select-none',
                              // hover
                              'hover:scale-[1.015] hover:-translate-y-0.5',
                              // active
                              'active:scale-[0.99]',
                              isActive &&
                                'border-accent/50 bg-card/60 ring-1 ring-accent/30'
                            )}
                          >
                            {/* subtle gradient wash */}
                            <div
                              className={cn(
                                'absolute inset-0 opacity-0 transition-opacity duration-700',
                                'bg-gradient-to-br from-accent/5 via-transparent to-transparent',
                                'group-hover:opacity-80',
                                isActive && 'opacity-60'
                              )}
                            />

                            {/* animated light sweep */}
                            <div
                              className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-700"
                              style={{
                                background:
                                  'linear-gradient(120deg, transparent 0%, rgba(var(--accent-rgb),0.06) 40%, transparent 80%)',
                                transform: 'translateX(-100%)',
                                animation: 'sweep 1.8s ease-out forwards'
                              }}
                            />

                            <div className="relative px-5 py-4 flex items-center gap-4">
                              {/* Icon */}
                              <div
                                className={cn(
                                  'shrink-0 size-11 rounded-xl',
                                  'bg-accent/10 border border-accent/10',
                                  'flex items-center justify-center',
                                  'transition-all duration-500',
                                  'group-hover:bg-accent/15 group-hover:border-accent/25 group-hover:scale-110 group-hover:rotate-1'
                                )}
                              >
                                <Icon className="size-5.5 text-accent transition-transform duration-700 group-hover:rotate-6" />
                              </div>

                              {/* Text */}
                              <div className="flex-1 min-w-0">
                                <p
                                  className={cn(
                                    'font-medium text-base truncate transition-colors duration-300',
                                    isActive
                                      ? 'text-accent'
                                      : 'text-foreground/90 group-hover:text-foreground'
                                  )}
                                >
                                  {account.name}
                                </p>

                                <div className="flex items-baseline gap-1.5 mt-0.5">
                                  <p className="text-2xl font-semibold tracking-tight text-foreground">
                                    {formatCurrency(account.currentBalance)}
                                  </p>
                                  <span className="text-base font-medium text-muted-foreground/70">
                                    {symbol}
                                  </span>
                                </div>
                              </div>

                              {isActive && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-accent/80" />
                              )}
                            </div>
                          </div>
                        }
                      />
                    )
                  })}
                </SidebarGroupContent>
              </SidebarGroup>
            )
          })}
        </ScrollArea>
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
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="border-t border-border/50 bg-background/70 backdrop-blur-sm">
        <SidebarMenu>
          <SidebarMenuItem>
            <CreateAccountModal />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
