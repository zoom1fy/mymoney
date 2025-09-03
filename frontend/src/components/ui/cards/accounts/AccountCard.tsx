'use client'

import { DynamicIcon } from '../../DynamicIcon'
import { Card, CardContent } from '../Сard'
import styles from './AccountCard.module.scss'
import * as React from 'react'

export interface AccountCardProps {
  name: string
  balance: number
  icon: string
  onClick?: () => void // ✅ поддержка клика
}

export const AccountCard: React.FC<AccountCardProps> = ({
  name,
  balance,
  icon,
  onClick // ✅ сюда нужно было добавить!
}) => {
  return (
    <Card
      className={styles.card}
      onClick={onClick} // теперь работает
    >
      <CardContent className={styles.content}>
        <DynamicIcon
          name={icon}
          size={24}
          className={styles.icon}
        />
        <div className={styles.details}>
          <span className={styles.name}>{name}</span>
          <span className={styles.balance}>{balance.toLocaleString()} ₽</span>
        </div>
      </CardContent>
    </Card>
  )
}
