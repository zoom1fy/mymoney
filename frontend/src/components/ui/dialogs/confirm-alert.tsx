'use client'

import { ReactNode } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/shadui/alert-dialog'

import { cn } from '@/lib/cn'

interface ConfirmAlertProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void

  title: string
  description?: ReactNode

  confirmText?: string
  cancelText?: string

  onConfirm: () => void
  isLoading?: boolean
  isDestructive?: boolean
}

export function ConfirmAlert({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  onConfirm,
  isLoading = false,
  isDestructive = true
}: ConfirmAlertProps) {
  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent
        className={cn(
          'max-w-xl md:max-w-2xl rounded-3xl p-10',
          'bg-background/70 backdrop-blur-xs',
          'border border-border/50 shadow-2xl',
          // Entrance / exit animations
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          'duration-200'
        )}
      >
        <AlertDialogHeader className="space-y-4">
          <AlertDialogTitle className="text-3xl font-bold">
            {title}
          </AlertDialogTitle>

          {description && (
            <AlertDialogDescription className="text-lg leading-relaxed">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-10 gap-4">
          <AlertDialogCancel
            className="h-12 px-8 text-lg rounded-xl cursor-pointer"
            disabled={isLoading}
          >
            {cancelText}
          </AlertDialogCancel>

          <AlertDialogAction
            className={cn(
              'h-12 px-8 text-lg rounded-xl cursor-pointer',
              isDestructive &&
                'bg-destructive text-destructive-foreground hover:bg-primary/90'
            )}
            disabled={isLoading}
            onClick={onConfirm}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
