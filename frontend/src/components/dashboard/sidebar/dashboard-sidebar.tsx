'use client'

import { useDashboard } from '@/components/dashboard/dashboard-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem
} from '@/components/ui/shadui/sidebar'

import {
  AccountCategoryEnum,
  IAccount,
  accountCategories,
  accountCategoryNameMap
} from '@/types/account.type'

import { useCurrencies } from '@/hooks/use-currencies'

import { formatCurrency } from '@/lib/format'

import { ScrollArea } from '../../ui/shadui/scroll-area'
import { AccountCard } from './account-card'
import { AccountCardSkeleton } from './account-card-skeleton'
import { AccountModal } from './account-modal'

export function DashboardSidebar() {
  const { accounts, categoryTotals, baseCurrencyCode, isLoading } = useDashboard()
  const { currencySymbolMap } = useCurrencies()

  // Totals come already converted to the base currency by the backend
  const totalsByCategory = new Map(
    categoryTotals.map(item => [item.categoryId, item.totalAmount])
  )
  const currencySymbol = currencySymbolMap[baseCurrencyCode]

  const groupedAccounts = accounts.reduce<
    Record<AccountCategoryEnum, IAccount[]>
  >(
    (acc, account) => {
      const category = account.categoryId as AccountCategoryEnum

      if (!acc[category]) {
        console.warn('Unknown category:', category, 'for account:', account)
        return acc
      }

      acc[category].push(account)
      return acc
    },
    {
      [AccountCategoryEnum.ACCOUNTS]: [],
      [AccountCategoryEnum.SAVINGS]: [],
      [AccountCategoryEnum.INVESTMENTS]: [],
      [AccountCategoryEnum.LOANS]: []
    }
  )

  return (
    <Sidebar>
      <SidebarHeader className="h-16 shrink-0 items-center justify-center border-b border-border/50 bg-background/70 px-4 backdrop-blur-sm">
        <h2 className="truncate text-xl font-bold tracking-tight">MyMoney</h2>
      </SidebarHeader>

      <SidebarContent>
        <ScrollArea className="flex-1 px-3 py-2">
          {isLoading &&
            accountCategories.map(category => (
              <SidebarGroup
                className="py-2"
                key={`skeleton-${category}`}
              >
                <SidebarGroupLabel className="h-auto justify-between gap-2 px-3 py-1 text-base font-semibold text-foreground/80">
                  <div className="h-4 w-20 bg-muted/40 rounded-full animate-pulse" />
                  <div className="h-4 w-14 bg-muted/30 rounded-full animate-pulse" />
                </SidebarGroupLabel>
                <SidebarGroupContent className="grid gap-3 mt-2">
                  <AccountCardSkeleton />
                  <AccountCardSkeleton />
                </SidebarGroupContent>
              </SidebarGroup>
            ))}

          {!isLoading &&
            accountCategories.map(category => {
              const accountsInCategory = groupedAccounts[category]

              if (!accountsInCategory || accountsInCategory.length === 0)
                return null

              const categoryName = accountCategoryNameMap[category]
              const categoryTotal = totalsByCategory.get(category)

              return (
                <SidebarGroup
                  className="py-2"
                  key={category}
                >
                  <SidebarGroupLabel className="h-auto justify-between gap-2 px-3 py-1 text-base font-semibold text-foreground/80">
                    <span className="truncate">{categoryName}</span>
                    {categoryTotal !== undefined && (
                      <span className="shrink-0 whitespace-nowrap text-sm font-semibold tabular-nums text-muted-foreground">
                        {formatCurrency(categoryTotal)}
                        {currencySymbol && (
                          <span className="ml-1 text-xs font-medium text-muted-foreground/70">
                            {currencySymbol}
                          </span>
                        )}
                      </span>
                    )}
                  </SidebarGroupLabel>

                  <SidebarGroupContent className="grid gap-3 mt-2">
                    {accountsInCategory.map(account => (
                      <AccountCard
                        account={account}
                        key={account.id}
                      />
                    ))}
                  </SidebarGroupContent>
                </SidebarGroup>
              )
            })}

          {!isLoading && accounts.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Пока нет счетов
            </div>
          )}
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 bg-background/70 backdrop-blur-sm">
        <SidebarMenu>
          <SidebarMenuItem>
            <AccountModal />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
