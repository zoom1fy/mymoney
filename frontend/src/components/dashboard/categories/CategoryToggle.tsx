'use client'

import { cn } from '@/lib/utils'

interface Props {
  isExpense: boolean
  onChange: (v: boolean) => void
}

export function CategoryToggle({ isExpense, onChange }: Props) {
  return (
    <div
      onClick={() => onChange(!isExpense)}
      className={cn(
        'group relative flex h-11 w-full rounded-full border border-border/40',
        'bg-muted/30 backdrop-blur-xl overflow-hidden p-1',
        'shadow-[0_1px_4px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)]',
        'cursor-pointer select-none'
      )}
    >
      {/* БЕГУНОК */}
      <div
        className={cn(
          'absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full',
          'bg-primary transition-transform duration-500',
          'ease-[cubic-bezier(0.2,0.8,0.2,1.1)]',
          'shadow-[0_2px_8px_rgba(0,0,0,0.14)]',
          'hover:scale-105 group-active:scale-[0.98]'
        )}
        style={{
          transform: isExpense ? 'translateX(99%)' : 'translateX(1%)'
        }}
      />

      {/* Текст: Доходы */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <span
          className={cn(
            'text-sm font-semibold transition-colors duration-300 delay-75',
            !isExpense ? 'text-primary-foreground' : 'text-muted-foreground'
          )}
        >
          Доходы
        </span>
      </div>

      {/* Текст: Расходы */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <span
          className={cn(
            'text-sm font-semibold transition-colors duration-300 delay-75',
            isExpense ? 'text-primary-foreground' : 'text-muted-foreground'
          )}
        >
          Расходы
        </span>
      </div>
    </div>
  )
}
