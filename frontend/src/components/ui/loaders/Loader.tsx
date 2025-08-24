'use client'

import styles from './Loader.module.scss'
import { FC } from 'react'

interface LoaderProps {
  size?: number // размер спиннера в px
  color?: string // цвет спиннера
  className?: string
}

export const Loader: FC<LoaderProps> = ({
  size = 40,
  color = '#7c3aed',
  className = ''
}) => {
  return (
    <div
      className={`${styles.loader} ${className}`}
      style={{
        width: size,
        height: size,
        borderColor: `${color} transparent transparent transparent`
      }}
      aria-label="loading"
    ></div>
  )
}
