'use client'

import styles from './CreateAccountModal.module.scss'
import { ModalPortal } from './ModalPortal'
import { accountService } from '@/services/account.service'
import { FC, useEffect, useState } from 'react'
import Swal from 'sweetalert2'

import { DeleteButton } from '@/components/ui/buttons/DeleteButton'
import { IconPicker } from '@/components/ui/modals/IconPicker'
import {
  FieldConfig,
  UniversalModal
} from '@/components/ui/modals/UniversalModal'

import {
  AccountCategoryEnum,
  AccountIconName,
  AccountTypeEnum,
  CurrencyCode,
  IAccount,
  ICreateAccount,
  IUpdateAccount
} from '@/types/account.types'

interface AccountModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (account?: IAccount) => void
  account?: IAccount
}

export const AccountModal: FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  account
}) => {
  const [loading, setLoading] = useState(false)
  const [selectedIcon, setSelectedIcon] = useState<AccountIconName>()

  useEffect(() => {
    if (account) {
      if (account.icon) {
        setSelectedIcon(account.icon as AccountIconName)
      }
    }
  }, [account])

  const fields: FieldConfig[] = [
    {
      name: 'name',
      label: 'Название счета',
      type: 'text',
      placeholder: 'Введите название',
      required: true,
      defaultValue: account?.name || '',
      validation: (value: string) =>
        value.length < 2 ? 'Название должно быть не менее 2 символов' : null
    },
    {
      name: 'categoryId',
      label: 'Категория',
      type: 'select',
      required: true,
      defaultValue: account?.categoryId || AccountCategoryEnum.ACCOUNTS,
      options: [
        { value: AccountCategoryEnum.ACCOUNTS, label: 'Счета' },
        { value: AccountCategoryEnum.SAVINGS, label: 'Сбережения' }
      ]
    },
    {
      name: 'typeId',
      label: 'Тип счета',
      type: 'select',
      required: true,
      defaultValue: account?.typeId || AccountTypeEnum.CARD,
      options: [
        { value: AccountTypeEnum.CARD, label: 'Карта' },
        { value: AccountTypeEnum.CASH, label: 'Наличные' },
        { value: AccountTypeEnum.CRYPTO, label: 'Криптовалюта' },
        { value: AccountTypeEnum.SAVING, label: 'Сберегательный' },
        { value: AccountTypeEnum.DEPOSIT, label: 'Депозит' }
      ]
    },
    {
      name: 'currencyCode',
      label: 'Валюта',
      type: 'select',
      required: true,
      defaultValue: account?.currencyCode || CurrencyCode.RUB,
      options: [
        { value: CurrencyCode.RUB, label: 'RUB - Российский рубль' },
        { value: CurrencyCode.USD, label: 'USD - Доллар США' },
        { value: CurrencyCode.EUR, label: 'EUR - Евро' },
        { value: CurrencyCode.BTC, label: 'BTC - Биткоин' }
      ]
    },
    {
      name: 'currentBalance',
      label: 'Баланс',
      type: 'number',
      placeholder: '0.00',
      defaultValue: account?.currentBalance || 0,
      validation: (value: number) =>
        value < 0 ? 'Баланс не может быть отрицательным' : null
    }
  ]

  const onSubmitForm = async (data: Record<string, any>) => {
    setLoading(true)
    try {
      if (account) {
        const updateData: IUpdateAccount = {
          name: data.name,
          categoryId: Number(data.categoryId) as AccountCategoryEnum,
          typeId: Number(data.typeId) as AccountTypeEnum,
          currencyCode: data.currencyCode as CurrencyCode,
          currentBalance: Number(data.currentBalance),
          ...(selectedIcon && { icon: selectedIcon })
        }
        const updated = await accountService.update(account.id, updateData)
        onSuccess?.(updated)
      } else {
        const createData: ICreateAccount = {
          name: data.name,
          categoryId: Number(data.categoryId) as AccountCategoryEnum,
          typeId: Number(data.typeId) as AccountTypeEnum,
          currencyCode: data.currencyCode as CurrencyCode,
          currentBalance: Number(data.currentBalance),
          ...(selectedIcon && { icon: selectedIcon })
        }
        const created = await accountService.create(createData)
        onSuccess?.(created)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!account) return

    const isDarkMode = document.documentElement.classList.contains('dark')

    const result = await Swal.fire({
      title: 'Вы уверены?',
      text: 'Вы не сможете восстановить этот счет!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: isDarkMode ? '#ef4444' : '#d33',
      cancelButtonColor: isDarkMode ? '#3b82f6' : '#3085d6',
      confirmButtonText: 'Да, удалить!',
      cancelButtonText: 'Отмена',
      background: isDarkMode ? 'var(--surface)' : '#fff',
      color: isDarkMode ? 'var(--text-primary)' : '#555',
      backdrop: isDarkMode
        ? `
        rgba(0, 0, 0, 0.7)
      `
        : `
        rgba(0, 0, 0, 0.4)
      `
    })

    if (result.isConfirmed) {
      setLoading(true)
      try {
        await accountService.delete(account.id)
        onSuccess?.()
        onClose()
        await Swal.fire({
          title: 'Удалено!',
          text: 'Ваш счет был удален.',
          icon: 'success',
          background: isDarkMode ? 'var(--surface)' : '#fff',
          color: isDarkMode ? 'var(--text-primary)' : '#555',
          confirmButtonColor: isDarkMode ? '#22c55e' : '#4caf50'
        })
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
    >
      <UniversalModal
        key={isOpen ? 'open' : 'closed'}
        isOpen={true}
        onClose={onClose}
        title={account ? 'Редактировать счет' : 'Создать новый счет'}
        headerActions={
          account && (
            <DeleteButton
              onClick={handleDelete}
              disabled={loading}
            >
              Удалить
            </DeleteButton>
          )
        }
        fields={fields}
        onSubmit={onSubmitForm}
        submitText={account ? 'Сохранить изменения' : 'Создать счет'}
        loading={loading}
        size="lg"
      >
        <div style={{ marginBottom: '1rem' }}>
          <div className={styles.pickerTitle}>Иконка счета</div>
          <IconPicker
            value={selectedIcon}
            onChange={setSelectedIcon}
          />
        </div>
      </UniversalModal>
    </ModalPortal>
  )
}
