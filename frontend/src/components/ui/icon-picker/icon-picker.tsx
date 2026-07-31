'use client'

import { LucideIcon } from 'lucide-react'

import { ScrollArea } from '@/components/ui/shadui/scroll-area'

import { cn } from '@/lib/cn'

interface Props<TIconName extends string> {
  icons: Record<TIconName, LucideIcon>
  value?: TIconName
  onChange: (iconName: TIconName) => void
  gridClassName?: string
  buttonClassName?: string
  iconClassName?: string
  scrollAreaClassName?: string
}

// Scrollable grid of selectable icons used for accounts, categories and similar entities.
export function IconPicker<TIconName extends string>({
  icons,
  value,
  onChange,
  gridClassName,
  buttonClassName = 'size-16',
  iconClassName = 'size-8',
  scrollAreaClassName
}: Props<TIconName>) {
  return (
    <ScrollArea
      className={cn('rounded-xl border bg-background/50', scrollAreaClassName)}
    >
      <div
        className={cn(
          'grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-4 p-4',
          gridClassName
        )}
      >
        {(Object.keys(icons) as TIconName[]).map(name => {
          const Icon = icons[name] as LucideIcon
          const isActive = value === name

          return (
            <button
              className={cn(
                'flex items-center justify-center rounded-xl border-2 cursor-pointer transition-[border-color,background-color,box-shadow] duration-200',
                buttonClassName,
                isActive
                  ? 'border-accent bg-accent/20 shadow-lg'
                  : 'border-transparent hover:border-accent/50 hover:bg-accent/10'
              )}
              key={name}
              type="button"
              onClick={() => onChange(name)}
            >
              <Icon className={iconClassName} />
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}
