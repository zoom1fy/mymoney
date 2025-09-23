'use client'

import styles from './TransactionModal.module.scss'
import { accountService } from '@/services/account.service'
import { categoryService } from '@/services/category.service'
import { transactionService } from '@/services/transaction.services'
import { confirmDialog } from '@/utils/confirm-dialog.utils'
import { ArrowRight, CircleQuestionMark } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { DeleteButton } from '@/components/ui/buttons/DeleteButton'
import { Toggle } from '@/components/ui/buttons/toggle/Toggle'
import { IconPicker } from '@/components/ui/modals/IconPicker'
import { UniversalModal } from '@/components/ui/modals/UniversalModal'
import { getCategoryFields } from '@/components/ui/modals/categories/category-fields.config'
import { getTransactionFields } from '@/components/ui/modals/transaction/transaction-fields.config'

import {
  AccountIconName,
  AccountIcons,
  CurrencyCode,
  IAccount
} from '@/types/account.types'
import {
  CategoryIconName,
  CategoryIcons,
  ICategory
} from '@/types/category.types'
import { TransactionType } from '@/types/transaction.types'

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  category: ICategory | null
  onSubmit: () => void
  transactionMode: 'transaction' | 'edit'
  setTransactionMode: (mode: 'transaction' | 'edit') => void
  onAccountUpdate?: (account: IAccount) => void
}

export function TransactionModal({
  isOpen,
  onClose,
  category,
  onSubmit,
  transactionMode,
  setTransactionMode,
  onAccountUpdate
}: TransactionModalProps) {
  const [accounts, setAccounts] = useState<IAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIcon, setSelectedIcon] = useState<CategoryIconName>(
    category?.icon || 'Circle'
  )
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(
    null
  )

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await accountService.getAll()
        setAccounts(data)
      } catch (error: any) {
        console.error('Ошибка загрузки счетов:', error)
        toast.error(
          error?.response?.data?.message || 'Не удалось загрузить счета'
        )
      }
    }
    if (isOpen) fetchAccounts()
  }, [isOpen])

  // Сброс состояния при открытии/закрытии окна
  useEffect(() => {
    if (isOpen) {
      setSelectedAccountId(null)
    }
  }, [isOpen])

  // Обновление иконки и сброс состояния при изменении категории или режима
  useEffect(() => {
    setSelectedIcon(category?.icon || 'Circle')
  }, [category, transactionMode])

  const handleSubmit = async (data: any) => {
    if (!category) return
    try {
      setLoading(true)
      if (transactionMode === 'transaction') {
        const amount = Number(data.amount)
        const accountId = Number(data.accountId)
        await transactionService.create({
          amount,
          accountId,
          categoryId: category.id,
          type: category.isExpense
            ? TransactionType.EXPENSE
            : TransactionType.INCOME,
          description: data.description || '',
          currencyCode: CurrencyCode.RUB
        })
        const updatedAccount = await accountService.getById(accountId)
        onAccountUpdate?.(updatedAccount)
      } else {
        await categoryService.update(category.id, {
          name: data.name,
          isExpense: category.isExpense,
          icon: selectedIcon
        })
        toast.success('Категория обновлена ✅')
      }
      onSubmit()
      onClose()
    } catch (error: any) {
      console.error('Ошибка:', error)
      toast.error(error?.response?.data?.message || 'Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!category) return
    const result = await confirmDialog({
      title: 'Удалить категорию?',
      text: 'Все связанные транзакции сохранятся, но категория будет удалена.',
      confirmText: 'Удалить',
      cancelText: 'Отмена'
    })
    if (!result.isConfirmed) return
    try {
      setLoading(true)
      await categoryService.delete(category.id)
      toast.success('Категория удалена 🗑️')
      onSubmit()
      onClose()
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Не удалось удалить категорию'
      )
    } finally {
      setLoading(false)
    }
  }

  const transactionFields = getTransactionFields(accounts).map(field =>
    field.name === 'accountId'
      ? {
          ...field,
          defaultValue: selectedAccountId ?? '',
          onChange: (val: string) => setSelectedAccountId(Number(val))
        }
      : field
  )

  const categoryFields = category
    ? getCategoryFields(category)
        .map(field =>
          field.name === 'name'
            ? { ...field, defaultValue: category.name }
            : field
        )
        .filter(f => f.name !== 'icon')
    : []

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        transactionMode === 'transaction'
          ? 'Выполнить транзакцию'
          : 'Редактировать категорию'
      }
      fields={
        transactionMode === 'transaction' ? transactionFields : categoryFields
      }
      onSubmit={handleSubmit}
      submitText={transactionMode === 'transaction' ? 'Выполнить' : 'Сохранить'}
      loading={loading}
      headerActions={
        transactionMode === 'edit' &&
        category && (
          <DeleteButton
            onClick={handleDelete}
            disabled={loading}
          >
            Удалить
          </DeleteButton>
        )
      }
      topContent={
        <div className={styles.topContent}>
          <div className={styles.toggleWrapper}>
            <Toggle
              leftText="Транзакция"
              rightText="Редактировать"
              isActive={transactionMode === 'edit'}
              onToggle={isActive =>
                setTransactionMode(isActive ? 'edit' : 'transaction')
              }
            />
          </div>
          {transactionMode === 'transaction' && category && (
            <div className={styles.transactionFlow}>
              <div className={styles.iconWrapper}>
                {(() => {
                  const account = accounts.find(a => a.id === selectedAccountId)
                  const Icon = account?.icon
                    ? AccountIcons[account.icon as AccountIconName]
                    : null
                  return (
                    <>
                      <div className={styles.iconCircle}>
                        {Icon ? (
                          <Icon size={40} />
                        ) : (
                          <CircleQuestionMark size={40} />
                        )}
                      </div>
                      <span className={styles.iconLabel}>
                        {account?.name || 'Выберите'}
                      </span>
                    </>
                  )
                })()}
              </div>
              <ArrowRight
                className={`${styles.arrow} ${
                  !category.isExpense ? styles.incomeArrow : ''
                }`}
              />
              <div className={styles.iconWrapper}>
                {(() => {
                  const Icon = CategoryIcons[selectedIcon]
                  return (
                    <>
                      <div className={styles.iconCircle}>
                        {Icon ? (
                          <Icon size={40} />
                        ) : (
                          <CircleQuestionMark size={40} />
                        )}
                      </div>
                      <span className={styles.iconLabel}>{category.name}</span>
                    </>
                  )
                })()}
              </div>
            </div>
          )}
        </div>
      }
    >
      {transactionMode === 'edit' && category && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ marginBottom: '0.5rem', fontWeight: 500 }}>
            Иконка категории
          </div>
          <IconPicker<CategoryIconName>
            icons={CategoryIcons}
            value={selectedIcon}
            onChange={setSelectedIcon}
          />
        </div>
      )}
    </UniversalModal>
  )
}
