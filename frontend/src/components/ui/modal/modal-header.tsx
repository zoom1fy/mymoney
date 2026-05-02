'use client'

import { Trash2, X } from 'lucide-react'
import { ReactNode } from 'react'

import { Button } from '@/components/ui/shadui/button'

interface ModalHeaderProps {
  icon: ReactNode
  title: string
  onClose: () => void
  onDelete?: () => void
  isDeleteLoading?: boolean
  showDelete?: boolean
}

export function ModalHeader({
  icon,
  title,
  onClose,
  onDelete,
  isDeleteLoading = false,
  showDelete = false
}: ModalHeaderProps) {
  return (
    <div className="relative">
      {/* Градиентный фон как в чате */}
      <div className="absolute -top-10 -left-10 w-32 h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent rounded-full blur-2xl" />
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-l from-primary/20 via-primary/10 to-transparent rounded-full blur-2xl" />

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg" />
            <div className="relative bg-gradient-to-br from-primary to-primary/70 p-2.5 rounded-xl shadow-lg">
              {icon}
            </div>
          </div>

          <div>
            <h2 className="text-base sm:text-xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {title}
            </h2>
          </div>
        </div>

        {/* Правая группа кнопок */}
        <div className="flex items-center gap-2">
          {/* Кнопка удаления */}
          {showDelete && onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onDelete}
              disabled={isDeleteLoading}
              className="text-destructive hover:bg-destructive/10 cursor-pointer shrink-0 h-12 w-12 rounded-full hover:scale-110 transition-all duration-300"
            >
              <Trash2 className="size-5" />
            </Button>
          )}

          {/* Кнопка закрытия как в чате */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-muted/50 transition-all duration-300 hover:scale-110 cursor-pointer h-12 w-12"
          >
            <X className="size-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
