'use client'

import styles from './ThemeToggle.module.scss'
import { MoonStar, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Чтобы избежать ошибок при SSR (иначе сначала "светлая", потом "тёмная")
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // Текущая тема: если выбрано "system", то берём системную
  const currentTheme = theme === 'system' ? systemTheme : theme

  return (
    <button
      className={styles.toggleButton}
      onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
      aria-label={`Переключить на ${currentTheme === 'light' ? 'тёмную' : 'светлую'} тему`}
    >
      <div className={styles.iconContainer}>
        <Sun
          className={`${styles.icon} ${currentTheme === 'dark' ? styles.hidden : ''}`}
          size={24}
        />
        <MoonStar
          className={`${styles.icon} ${currentTheme === 'light' ? styles.hidden : ''}`}
          size={24}
        />
      </div>
    </button>
  )
}
