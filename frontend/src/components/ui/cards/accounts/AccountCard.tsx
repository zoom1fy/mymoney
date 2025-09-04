'use client'

import { DynamicIcon } from '../../DynamicIcon'
import { Card, CardContent } from '../Сard'
import styles from './AccountCard.module.scss'
import { getCurrencySymbol } from '@/utils/currency-symbols'
import * as React from 'react'

import { CurrencyCode } from '@/types/account.types'

export interface AccountCardProps {
  name: string
  balance: number
  icon: string
  currencyCode: CurrencyCode
  onClick?: () => void
}

export const AccountCard: React.FC<AccountCardProps> = ({
  name,
  balance,
  icon,
  currencyCode,
  onClick
}) => {
  return (
    <Card
      className={styles.card}
      onClick={onClick}
    >
      <CardContent className={styles.content}>
        <DynamicIcon
          name={icon}
          size={24}
          className={styles.icon}
        />
        <div className={styles.details}>
          <span className={styles.name}>{name}</span>
          <span className={styles.balance}>
            {balance.toLocaleString()} {getCurrencySymbol(currencyCode)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
