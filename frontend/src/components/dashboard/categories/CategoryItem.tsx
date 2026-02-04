'use client'

import { cn } from '@/lib/utils'
import { useState } from 'react'

import { CategoryIconName, CategoryIcons } from '@/types/category.types'

interface Props {
  name: string
  icon?: CategoryIconName
  editMode?: boolean
  onClick?: () => void
  amount?: number
  color?: string
}

export function CategoryItem({
  name,
  icon = 'Circle',
  editMode = false,
  onClick,
  amount = 0,
  color = 'hsl(var(--primary))',
}: Props) {
  const Icon = CategoryIcons[icon]
  const [isHovered, setIsHovered] = useState(false)

  const displayAmount = amount ?? 0

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'flex flex-col items-center gap-2.5 cursor-pointer select-none transition-all duration-300 group',
        editMode && 'animate-ios-wiggle'
      )}
      style={editMode ? { animationDelay: `${Math.random() * 0.15}s` } : undefined}
    >
      <div
        className={cn(
          'size-16 sm:size-18 rounded-full border border-border flex items-center justify-center transition-all duration-300',
          'group-hover:scale-105 group-hover:shadow-lg',
          editMode && 'animate-pulse-slow'
        )}
        style={{
          borderColor: isHovered ? color : undefined,
          backgroundColor: isHovered ? `${color}15` : undefined,
          boxShadow: isHovered ? `0 0 10px ${color}30` : undefined,
        }}
      >
        <Icon
          className="size-7 sm:size-8 transition-all duration-300"
          style={{
            color: color,
            filter: isHovered ? `drop-shadow(0 0 8px ${color}50)` : 'none',
          }}
        />
      </div>

      <div className="flex flex-col items-center -space-y-0.5">
        <p
          className={cn(
            'text-[14px] sm:text-[15px] font-medium text-center leading-tight text-muted-foreground transition-colors duration-300',
            'group-hover:text-foreground'
          )}
        >
          {name}
        </p>

        <p
          className={cn(
            'text-[12px] sm:text-[13px] font-semibold tabular-nums transition-colors duration-300',
            'text-foreground/70 group-hover:text-foreground'
          )}
        >
          {displayAmount.toLocaleString('ru-RU')} ₽
        </p>
      </div>
    </div>
  )
}