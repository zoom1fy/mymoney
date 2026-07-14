'use client'

import { Pencil } from 'lucide-react'

import { cn } from '@/lib/cn'

interface Props {
  isActive: boolean
  onToggle: () => void
}

export function EditModeButton({ isActive, onToggle }: Props) {
  return (
    <button
      aria-label="Режим редактирования категорий"
      className={cn(
        'size-10 rounded-full border flex items-center justify-center transition-all cursor-pointer',
        isActive
          ? 'bg-accent text-accent-foreground shadow-lg scale-110'
          : 'bg-background hover:bg-muted'
      )}
      onClick={onToggle}
    >
      <Pencil className="size-5" />
    </button>
  )
}
