'use client'

import { CreateAccountModal } from './CreateAccountModal'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Wallet } from 'lucide-react'
import { usePathname } from 'next/navigation'

import { AccountIcons } from '@/types/account.types'
import type { IAccount } from '@/types/account.types'

interface Props {
  account: IAccount
}

export function AccountCard({ account }: Props) {
  const pathname = usePathname()
  const isActive = pathname === `/dashboard/accounts/${account.id}`

  const Icon = AccountIcons[account.icon || 'Wallet'] || Wallet
  const symbol =
    { RUB: '₽', USD: '$', EUR: '€', BTC: '₿' }[account.currencyCode] || '₽'

  return (
    <CreateAccountModal
      mode="edit"
      account={account}
      trigger={
        <div
          className={cn(
            'group relative overflow-hidden rounded-2xl',
            'border border-border/40 bg-card/40 backdrop-blur-xl',
            'transition-all duration-500 ease-out cursor-pointer select-none',
            'hover:scale-[1.015] hover:-translate-y-0.5 active:scale-[0.99]',
            isActive && 'border-accent/50 bg-card/60 ring-1 ring-accent/30'
          )}
        >
          {/* градиент */}
          <div
            className={cn(
              'absolute inset-0 opacity-0 transition-opacity duration-700',
              'bg-gradient-to-br from-accent/5 via-transparent to-transparent',
              'hover:opacity-80',
              isActive && 'opacity-60'
            )}
          />

          {/* sweep */}
          <div
            className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition duration-700"
            style={{
              background:
                'linear-gradient(120deg, transparent 0%, rgba(var(--accent-rgb),0.06) 40%, transparent 80%)',
              transform: 'translateX(-100%)',
              animation: 'sweep 1.8s ease-out forwards'
            }}
          />

          <div className="relative px-4 py-3.5 flex items-center gap-3">
            <div
              className={cn(
                'shrink-0 size-11 rounded-xl bg-accent/10 border border-accent/10',
                'flex items-center justify-center transition-all duration-500',
                'group-hover:bg-accent/15 group-hover:border-accent/25 group-hover:scale-110 group-hover:rotate-1'
              )}
            >
              <Icon className="size-5.5 text-accent transition-transform duration-700 group-hover:rotate-6" />
            </div>

            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'font-medium transition-colors duration-300',
                  'text-sm sm:text-base', // ← мобильные — поменьше
                  'line-clamp-2',
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
}
