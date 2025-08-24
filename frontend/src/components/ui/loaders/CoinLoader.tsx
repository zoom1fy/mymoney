'use client'

import styles from './CoinLoader.module.scss'
import { FC } from 'react'

interface CoinLoaderProps {
  size?: number
  className?: string
}

export const CoinLoader: FC<CoinLoaderProps> = ({
  size = 80,
  className = ''
}) => {
  return (
    <div
      className={`${styles.wrapper} ${className}`}
      style={{ width: size, height: size }}
    >
      <div className={styles.coin}></div>
    </div>
  )
}
