'use client'

import { ScrollArea } from '../ui/shadui/scroll-area'
import { CreateAccountModal } from './CreateAccountModal'
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

                <SidebarGroupContent className="grid gap-2 mt-2">
                  {accountsInCategory.map(account => {
                    const Icon = IconComponent(account.icon)
                    const symbol = currencySymbols[account.currencyCode]

                    return (
                      <CreateAccountModal
                        key={account.id}
                        mode="edit"
                        account={account}
                        trigger={
                          <div
                            className={cn(
                              'block rounded-xl border bg-card/40 backdrop-blur-sm p-4 transition-all cursor-pointer',
                              'hover:bg-card/70 hover:shadow-md hover:border-accent/30',
                              pathname ===
                                `/dashboard/accounts/${account.id}` &&
                                'ring-2 ring-accent/50 bg-card/60 border-accent/40'
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className="rounded-lg bg-accent/10 p-2.5">
                                <Icon className="size-6 text-accent" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-base truncate">
                                  {account.name}
                                </p>
                                <p className="text-lg font-bold text-foreground mt-0.5">
                                  {account.currentBalance.toLocaleString(
                                    'ru-RU'
                                  )}{' '}
                                  {symbol}
                                </p>
                              </div>
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
