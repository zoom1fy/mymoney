'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

import { cn } from '@/lib/cn'

interface SegmentedOption<T extends string> {
  value: T
  label: ReactNode
}

interface SegmentedControlProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: SegmentedOption<T>[]
  className?: string
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        'grid gap-1 rounded-xl bg-muted/50 border border-border/50 p-1',
        className
      )}
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`
      }}
    >
      {options.map(option => {
        const isActive = option.value === value

        return (
          <button
            className={cn(
              'relative h-9 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer',
              isActive
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground/80'
            )}
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
          >
            {isActive && (
              <motion.span
                className="absolute inset-0 rounded-lg bg-background shadow-sm border border-border/60"
                layoutId="segmented-active"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
