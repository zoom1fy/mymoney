'use client'

import styles from './Sidebar.module.scss'
import { AccountModal } from './accounts-chapter/AccountModal'
import { AccountsChapter } from './accounts-chapter/AccountsChapter'
import { ChevronDown, ChevronRight, Menu, Plus } from 'lucide-react'
import { FC, useState } from 'react'

import { ButtonPlus } from '@/components/ui/buttons/ButtonPlus'

import { IAccount } from '@/types/account.types'

export const Sidebar: FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [editingAccount, setEditingAccount] = useState<IAccount | undefined>(
    undefined
  )

  return (
    <>
      <button
        className={styles.mobileToggle}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <Menu size={24} />
      </button>

      <aside className={`${styles.sidebar} ${mobileOpen ? styles.open : ''}`}>
        <h2 className={styles.sidebarTitle}>MyMoney</h2>
        <ButtonPlus
          onClick={() => {
            setEditingAccount(undefined) // Сбрасываем для создания нового аккаунта
            setModalOpen(true)
          }}
          size="small"
          variant="outline"
          iconPosition="left"
          className={styles.addButton}
        >
          Добавить счет
        </ButtonPlus>
        <div
          className={styles.chapterHeader}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          <span>Все счета</span>
        </div>

        {!collapsed && (
          <div className={styles.accountsWrapper}>
            <AccountsChapter
              key={refreshKey}
              refreshKey={refreshKey}
              setEditingAccount={setEditingAccount} // Передаем setEditingAccount
              setModalOpen={setModalOpen} // Передаем setModalOpen
            />
          </div>
        )}
        {modalOpen && (
          <AccountModal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false)
              setEditingAccount(undefined) // Сбрасываем при закрытии
            }}
            onSuccess={() => {
              setRefreshKey(prev => prev + 1) // Триггер перезагрузки списка
              setModalOpen(false)
              setEditingAccount(undefined) // Сбрасываем после успеха
            }}
            account={editingAccount} // Тип теперь IAccount | undefined
          />
        )}
      </aside>
    </>
  )
}
