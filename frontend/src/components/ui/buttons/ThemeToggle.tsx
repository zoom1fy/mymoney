'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/shadui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <Button
        disabled
        className="size-8 cursor-pointer"
        size="sm"
        variant="ghost"
      >
        <span className="size-4" />
      </Button>
    )
  }

  const isDark = theme === 'dark'

  return (
    <Button
      className="size-8 cursor-pointer"
      size="sm"
      title={isDark ? 'Светлая тема' : 'Тёмная тема'}
      variant="ghost"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? (
        <Sun className="size-4 transition-all" />
      ) : (
        <Moon className="size-4 transition-all" />
      )}
    </Button>
  )
}
