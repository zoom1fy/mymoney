'use client'

import { backupService } from '@/services/backup.service'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { formatFileSize } from '@/lib/backup'

export function useDatabaseBackup() {
  const mutation = useMutation({
    mutationFn: () => backupService.createBackup(),

    onSuccess: backup => {
      // Null means the save dialog was dismissed — nothing to report
      if (!backup) return

      toast.success('Резервная копия сохранена', {
        description: `${formatFileSize(backup.size)} · ${backup.path}`
      })
    },

    // Tauri rejects commands with a plain string, not an Error instance
    onError: (error: unknown) => {
      const message =
        typeof error === 'string'
          ? error
          : error instanceof Error
            ? error.message
            : ''

      toast.error(message || 'Не удалось создать резервную копию')
    }
  })

  return {
    createBackup: mutation.mutate,
    isBackingUp: mutation.isPending
  }
}
