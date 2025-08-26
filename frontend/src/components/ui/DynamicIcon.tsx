'use client'

import * as Icons from 'lucide-react'

interface Props {
  name: string
  size?: number
  className?: string
}

export function DynamicIcon({ name, size = 20, className }: Props) {
  const LucideIcon = (Icons as any)[name]

  if (!LucideIcon) {
    return (
      <Icons.HelpCircle
        size={size}
        className={className}
      />
    ) // fallback
  }

  return (
    <LucideIcon
      size={size}
      className={className}
    />
  )
}
