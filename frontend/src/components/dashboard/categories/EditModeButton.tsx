'use client'

import { cn } from '@/lib/utils'
import { Pencil } from 'lucide-react'

interface Props {
  active: boolean
  onToggle: () => void
}

export function EditModeButton({ active, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'size-10 rounded-full border flex items-center justify-center transition-all cursor-pointer',
        active
          ? 'bg-accent text-accent-foreground shadow-lg scale-110'
          : 'bg-background hover:bg-muted'
      )}
      aria-label="Режим редактирования категорий"
    >
      <Pencil className="size-5" />
    </button>
  )
}
