'use client'

import Swal from 'sweetalert2'

export interface ConfirmDialogOptions {
  title?: string
  text?: string
  confirmText?: string
  cancelText?: string
}

export const confirmDialog = async ({
  title = 'Вы уверены?',
  text = 'Это действие нельзя отменить!',
  confirmText = 'Да',
  cancelText = 'Отмена'
}: ConfirmDialogOptions = {}) => {
  const isDarkMode = document.documentElement.classList.contains('dark')

  return Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: isDarkMode ? '#ef4444' : '#d33',
    cancelButtonColor: isDarkMode ? '#3b82f6' : '#3085d6',
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    background: isDarkMode ? 'var(--surface)' : '#fff',
    color: isDarkMode ? 'var(--text-primary)' : '#555',
    backdrop: isDarkMode ? `rgba(0, 0, 0, 0.7)` : `rgba(0, 0, 0, 0.4)`
  })
}
