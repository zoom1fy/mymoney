'use client'

import { Button, ButtonProps } from './Button'
import styles from './ButtonPlus.module.scss'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'

interface ButtonPlusProps extends ButtonProps {
  /**
   * Размер кнопки
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large'

  /**
   * Стиль кнопки
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'ghost'

  /**
   * Показывать анимацию пульсации
   * @default false
   */
  withPulse?: boolean

  /**
   * Позиция иконки
   * @default 'left'
   */
  iconPosition?: 'left' | 'right'

  /**
   * Только иконка (без текста)
   * @default false
   */
  iconOnly?: boolean
}

export function ButtonPlus({
  children,
  size = 'medium',
  variant = 'default',
  withPulse = false,
  iconPosition = 'left',
  iconOnly = false,
  className,
  ...rest
}: ButtonPlusProps) {
  const buttonClass = cn(
    styles.buttonPlus,
    styles[size],
    styles[variant],
    withPulse && styles.pulse,
    iconOnly && styles.iconOnly,
    className
  )

  const icon = <Plus className={styles.icon} />

  const content = iconOnly ? (
    icon
  ) : (
    <>
      {iconPosition === 'left' && icon}
      <span>{children}</span>
      {iconPosition === 'right' && icon}
    </>
  )

  return (
    <Button
      className={buttonClass}
      {...rest}
    >
      {content}
    </Button>
  )
}
