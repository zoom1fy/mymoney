'use client'

import { Pencil } from 'lucide-react'

import { cn } from '@/lib/utils'

interface Props {
  active: boolean
  onToggle: () => void
}

export function EditModeButton({ active, onToggle }: Props) {
  return (
    <button
      aria-label="Режим редактирования категорий"
      className={cn(
        'size-10 rounded-full border flex items-center justify-center transition-all cursor-pointer',
        active
          ? 'bg-accent text-accent-foreground shadow-lg scale-110'
          : 'bg-background hover:bg-muted'
      )}
      onClick={onToggle}
    >
      <Pencil className="size-5" />
    </button>
  )
}
