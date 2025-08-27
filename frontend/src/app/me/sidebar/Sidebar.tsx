'use client'

import styles from './Sidebar.module.scss'
import { AccountsChapter } from './accounts-chapter/AccountsChapter'
import { CreateAccountModal } from './accounts-chapter/CreateAccountModal'
import { ChevronDown, ChevronRight, Menu, Plus } from 'lucide-react'
import { FC, useState } from 'react'

import { ButtonPlus } from '@/components/ui/buttons/ButtonPlus'

export const Sidebar: FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <>
      {/* Кнопка гамбургера на мобильных */}
      <button
        className={styles.mobileToggle}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <Menu size={24} />
      </button>

      <aside className={`${styles.sidebar} ${mobileOpen ? styles.open : ''}`}>
        <h2 className={styles.sidebarTitle}>MyMoney</h2>
        {/* Кнопка добавления с использованием ButtonPlus */}
        <ButtonPlus
          onClick={() => setModalOpen(true)}
          size="small" // или 'medium' в зависимости от нужного размера
          variant="outline" // или 'default' для основной кнопки
          iconPosition="left"
          className={styles.addButton} // если нужны дополнительные стили
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
            <AccountsChapter key={refreshKey} />
          </div>
        )}
        {modalOpen && (
          <CreateAccountModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onSuccess={() => {
              setRefreshKey(prev => prev + 1) // Триггер перезагрузки списка
            }}
          />
        )}
      </aside>
    </>
  )
}
