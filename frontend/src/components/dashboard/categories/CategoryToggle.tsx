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
      className="relative flex h-11 rounded-full border bg-muted/40 backdrop-blur-sm p-1 cursor-pointer select-none overflow-hidden"
    >
      {/* Бегунок */}
      <div
        className={cn(
          'absolute top-1 bottom-1 w-[calc(50%-0.5rem)] rounded-full',
          'bg-primary/15 shadow-sm',
          'transition-[left] duration-300 ease-[cubic-bezier(.22,1,.36,1)]',
          'hover:scale-',
          isExpense ? 'left-[calc(50%+0.25rem)]' : 'left-1'
        )}
      />

      {/* Доходы */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <span
          className={cn(
            'text-sm font-medium transition-colors',
            !isExpense ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          Доходы
        </span>
      </div>

      {/* Расходы */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <span
          className={cn(
            'text-sm font-medium transition-colors',
            isExpense ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          Расходы
        </span>
      </div>
    </div>
  )
}
