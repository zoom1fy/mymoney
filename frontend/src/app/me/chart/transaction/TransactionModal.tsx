'use client'

import { accountService } from '@/services/account.service'
import { categoryService } from '@/services/category.service'
import { transactionService } from '@/services/transaction.services'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Toggle } from '@/components/ui/buttons/toggle/Toggle'
import { IconPicker } from '@/components/ui/modals/IconPicker'
import { UniversalModal } from '@/components/ui/modals/UniversalModal'
import { getCategoryFields } from '@/components/ui/modals/categories/category-fields.config'
import { getTransactionFields } from '@/components/ui/modals/transaction/transaction-fields.config'

import { CurrencyCode, IAccount } from '@/types/account.types'
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

  useEffect(() => {
    setSelectedIcon(category?.icon || 'Circle')
  }, [category])

  const handleSubmit = async (data: any) => {
    if (!category) return
    try {
      setLoading(true)

      if (transactionMode === 'transaction') {
        // Создание транзакции
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
        // Редактирование категории с выбором иконки
        await categoryService.update(category.id, {
          name: data.name,
          isExpense: category.isExpense,
          icon: selectedIcon
        })
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

  const transactionFields = getTransactionFields(accounts)
  const categoryFields = category
    ? getCategoryFields(category).filter(f => f.name !== 'icon')
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
      topContent={
        <Toggle
          leftText="Транзакция"
          rightText="Редактировать"
          isActive={transactionMode === 'edit'}
          onToggle={isActive =>
            setTransactionMode(isActive ? 'edit' : 'transaction')
          }
        />
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
