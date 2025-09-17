'use client'

import { accountService } from '@/services/account.service'
import { transactionService } from '@/services/transaction.services'
import { useEffect, useState } from 'react'

import { Toggle } from '@/components/ui/buttons/toggle/Toggle'
import { UniversalModal } from '@/components/ui/modals/UniversalModal'
import { getTransactionFields } from '@/components/ui/modals/transaction/transaction-fields.config'

import { CurrencyCode, IAccount } from '@/types/account.types'
import { ICategory } from '@/types/category.types'
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

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await accountService.getAll()
        setAccounts(data)
      } catch (error) {
        console.error('Ошибка загрузки счетов:', error)
      }
    }
    if (isOpen) fetchAccounts()
  }, [isOpen])

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true)
      if (transactionMode === 'transaction') {
        const amount = Number(data.amount)
        const accountId = Number(data.accountId)

        const transaction = await transactionService.create({
          amount,
          accountId,
          categoryId: category?.id,
          type: category?.isExpense
            ? TransactionType.EXPENSE
            : TransactionType.INCOME,
          description: data.description || '',
          currencyCode: CurrencyCode.RUB
        })

        const updatedAccount = await accountService.getById(accountId)
        onAccountUpdate?.(updatedAccount)
      } else {
        // Логика для редактирования транзакции
      }
      onSubmit()
      onClose()
    } catch (error) {
      console.error('Ошибка:', error)
    } finally {
      setLoading(false)
    }
  }

  const transactionFields = getTransactionFields(accounts)

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        transactionMode === 'transaction'
          ? 'Выполнить транзакцию'
          : 'Редактировать категорию'
      }
      fields={transactionFields}
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
    ></UniversalModal>
  )
}
