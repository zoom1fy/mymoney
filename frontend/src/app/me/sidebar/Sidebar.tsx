'use client'

import styles from './Sidebar.module.scss'
import { AccountsChapter } from './accounts-chapter/AccountsChapter'
import { ChevronDown, ChevronRight, Menu } from 'lucide-react'
import * as React from 'react'

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)

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

        <div
          className={styles.chapterHeader}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          <span>Все счета</span>
        </div>

        {!collapsed && (
          <div className={styles.accountsWrapper}>
            <AccountsChapter />
          </div>
        )}
      </aside>
    </>
  )
}
