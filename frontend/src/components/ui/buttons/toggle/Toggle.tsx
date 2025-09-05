// src/components/ui/toggle/Toggle.tsx
'use client'

import styles from './Toggle.module.scss'
import React from 'react'

// src/components/ui/toggle/Toggle.tsx

interface IToggleProps {
  leftText: string
  rightText: string
  isActive: boolean
  onToggle: (isActive: boolean) => void
  disabled?: boolean
}

export const Toggle = ({
  leftText,
  rightText,
  isActive,
  onToggle,
  disabled
}: IToggleProps) => {
  const handleToggle = () => {
    if (!disabled) onToggle(!isActive)
  }

  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggle(!isActive)
    }
  }

  return (
    <div
      role="switch"
      aria-checked={isActive}
      aria-label={`${leftText} / ${rightText}`}
      tabIndex={disabled ? -1 : 0}
      className={`${styles.toggle} ${isActive ? styles.active : ''} ${disabled ? styles.disabled : ''}`}
      onClick={handleToggle}
      onKeyDown={handleKey}
    >
      <div className={styles.track} />
      <div className={styles.thumb} />

      <span
        className={`${styles.label} ${styles.left} ${!isActive ? styles.labelActive : ''}`}
      >
        {leftText}
      </span>
      <span
        className={`${styles.label} ${styles.right} ${isActive ? styles.labelActive : ''}`}
      >
        {rightText}
      </span>
    </div>
  )
}
