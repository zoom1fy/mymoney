'use client'

import styles from './AccountsChapter.module.scss'
import { accountService } from '@/services/account.service'
import { Loader } from 'lucide-react'
import { FC, useEffect, useState } from 'react'

import { AccountCard } from '@/components/ui/cards/accounts/AccountCard'

import { IAccount } from '@/types/account.types'

interface CategoryState {
  [key: string]: boolean
}
interface AccountsChapterProps {
  refreshKey?: number
  setEditingAccount: (account: IAccount | undefined) => void // Обновлённый тип
  setModalOpen: (open: boolean) => void
  onAccountUpdate?: (account: IAccount) => void
}
export const AccountsChapter: FC<AccountsChapterProps> = ({
  refreshKey,
  setEditingAccount,
  setModalOpen,
  onAccountUpdate
}) => {
  const [accounts, setAccounts] = useState<IAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState<CategoryState>({
    '1': false, // Счета
    '2': false // Сбережения
  })
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await accountService.getAll()
        setAccounts(data)
      } finally {
        setLoading(false)
      }
    }
    fetchAccounts()
  }, [refreshKey])
  const toggleCategory = (categoryId: string) => {
    setCollapsed(prev => ({ ...prev, [categoryId]: !prev[categoryId] }))
  }
  const categories = [
    { id: '1', title: 'Мои счета' },
    { id: '2', title: 'Мои сбережения' }
  ]

  const handleAccountUpdate = (updated: IAccount) => {
    setAccounts(prev =>
      prev.map(acc => (acc.id === updated.id ? updated : acc))
    )
    // если есть внешний callback
    if (onAccountUpdate) onAccountUpdate(updated)
  }

  return (
    <div className={styles.accountsChapter}>
      {categories.map(cat => {
        const filteredAccounts = accounts.filter(
          acc => acc.categoryId === Number(cat.id)
        )
        const isCollapsed = collapsed[cat.id]
        return (
          <div
            key={cat.id}
            className={styles.category}
          >
            <div
              className={styles.header}
              onClick={() => toggleCategory(cat.id)}
            >
              <span className={styles.title}>{cat.title}</span>
              <span className={styles.collapseIcon}>
                {isCollapsed ? '+' : '-'}
              </span>
            </div>
            {loading && (
              <div className={styles.loading}>
                <Loader className={styles.loader} />
                Загрузка...
              </div>
            )}
            {!loading && (
              <div
                className={`${styles.cardsWrapper} ${!isCollapsed ? styles.expanded : ''}`}
              >
                {filteredAccounts.length > 0 ? (
                  <div className={styles.cards}>
                    {filteredAccounts.map(acc => (
                      <AccountCard
                        key={acc.id}
                        name={acc.name}
                        balance={acc.currentBalance}
                        icon={acc.icon || 'Wallet'}
                        currencyCode={acc.currencyCode}
                        onClick={() => {
                          setEditingAccount(acc)
                          setModalOpen(true)
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <p className={styles.empty}>Нет счетов</p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
