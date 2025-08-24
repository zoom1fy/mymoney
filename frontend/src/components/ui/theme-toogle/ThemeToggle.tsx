'use client'

import styles from './ThemeToggle.module.scss'
import { MoonStar,  Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light')
    setTheme(initialTheme)
    document.documentElement.classList.toggle('dark', initialTheme === 'dark')
    document.documentElement.setAttribute('data-theme', initialTheme)
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setIsAnimating(true)
    setTimeout(() => {
      setTheme(nextTheme)
      localStorage.setItem('theme', nextTheme)
      document.documentElement.classList.toggle('dark', nextTheme === 'dark')
      document.documentElement.setAttribute('data-theme', nextTheme)
      setIsAnimating(false)
    }, 100)
  }

  return (
    <button
      className={`${styles.toggleButton} ${isAnimating ? styles.animate : ''}`}
      onClick={toggleTheme}
      aria-label={`Переключить на ${theme === 'light' ? 'тёмную' : 'светлую'} тему`}
    >
      <div className={styles.iconContainer}>
        <Sun
          className={`${styles.icon} ${theme === 'dark' ? styles.hidden : ''}`}
          size={24}
        />
        <MoonStar
          className={`${styles.icon} ${theme === 'light' ? styles.hidden : ''}`}
          size={24}
        />
      </div>
    </button>
  )
}
