'use client'

import { cn } from '@/lib/utils'

import { CategoryIconName, CategoryIcons } from '@/types/category.types'

interface Props {
  name: string
  icon?: CategoryIconName
  editMode?: boolean
  onClick?: () => void
}

export function CategoryItem({
  name,
  icon = 'Circle',
  editMode = false,
  onClick
}: Props) {
  const Icon = CategoryIcons[icon]

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 cursor-pointer select-none transition-all duration-300 group',
        editMode && 'animate-ios-wiggle'
      )}
      style={
        editMode ? { animationDelay: `${Math.random() * 0.15}s` } : undefined
      }
    >
      <div
        className={cn(
          'size-16 rounded-full border flex items-center justify-center',
          'transition-all duration-300',
          'group-hover:scale-105 group-hover:shadow-md group-hover:shadow-accent/20',
          'group-hover:border-accent/60',
          editMode && 'animate-pulse-slow'
        )}
      >
        <Icon className="size-7 text-accent transition-colors duration-300 group-hover:text-accent/90" />
      </div>
      <p className="text-sm text-muted-foreground transition-colors duration-300 group-hover:text-foreground/90">
        {name}
      </p>
    </div>
  )
}
