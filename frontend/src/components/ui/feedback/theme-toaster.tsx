'use client'

import { useTheme } from 'next-themes'
import { Toaster } from 'sonner'

export function ThemeToaster() {
  const { resolvedTheme } = useTheme()

  return (
    <Toaster
      duration={1500}
      position="bottom-right"
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
    />
  )
}