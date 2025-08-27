'use client'

import styles from './IconPicker.module.scss'

import { AccountIconName, AccountIcons } from '@/types/account.types'

interface IconPickerProps<T extends string> {
  icons?: Record<T, React.ComponentType<any>> // Набор иконок (по умолчанию AccountIcons)
  value?: T
  onChange: (iconName: T) => void
}

export function IconPicker<T extends string>({
  icons = AccountIcons as Record<T, React.ComponentType<any>>,
  value,
  onChange
}: IconPickerProps<T>) {
  const iconEntries = Object.entries(icons) as [T, React.ComponentType<any>][]

  return (
    <div className={styles.iconPicker}>
      <div className={styles.iconGrid}>
        {iconEntries.map(([iconName, IconComponent]) => (
          <div
            key={iconName}
            className={`${styles.iconItem} ${value === iconName ? styles.selected : ''}`}
            onClick={() => onChange(iconName)}
            title={iconName}
          >
            <IconComponent size={20} />
          </div>
        ))}
      </div>
    </div>
  )
}
