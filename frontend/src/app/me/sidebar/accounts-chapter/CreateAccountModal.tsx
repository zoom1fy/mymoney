'use client'

import { ModalPortal } from './ModalPortal'
import { accountService } from '@/services/account.service'
import { FC, useState } from 'react'
import { useForm } from 'react-hook-form'
import styles from './CreateAccountModal.module.scss'

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
  ICreateAccount
} from '@/types/account.types'

interface CreateAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (account?: IAccount) => void
}

export const CreateAccountModal: FC<CreateAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false)
  const [selectedIcon, setSelectedIcon] = useState<AccountIconName>()

  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      name: '',
      categoryId: AccountCategoryEnum.ACCOUNTS,
      typeId: AccountTypeEnum.CARD,
      currencyCode: CurrencyCode.RUB,
      currentBalance: 0
    }
  })

  const fields: FieldConfig[] = [
    {
      name: 'name',
      label: 'Название счета',
      type: 'text',
      placeholder: 'Введите название',
      required: true,
      validation: value =>
        value.length < 2 ? 'Название должно быть не менее 2 символов' : null
    },
    {
      name: 'categoryId',
      label: 'Категория',
      type: 'select',
      required: true,
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
      options: [
        { value: CurrencyCode.RUB, label: 'RUB - Российский рубль' },
        { value: CurrencyCode.USD, label: 'USD - Доллар США' },
        { value: CurrencyCode.EUR, label: 'EUR - Евро' },
        { value: CurrencyCode.BTC, label: 'BTC - Биткоин' }
      ]
    },
    {
      name: 'currentBalance',
      label: 'Начальный баланс',
      type: 'number',
      placeholder: '0.00',
      defaultValue: 0,
      validation: value =>
        value < 0 ? 'Баланс не может быть отрицательным' : null
    }
  ]

  const onSubmitForm = async (data: Record<string, any>) => {
    setLoading(true)
    try {
      const createData: ICreateAccount = {
        name: data.name as string,
        categoryId: Number(data.categoryId) as AccountCategoryEnum,
        typeId: Number(data.typeId) as AccountTypeEnum,
        currencyCode: data.currencyCode as CurrencyCode,
        currentBalance: Number(data.currentBalance),
        ...(selectedIcon && { icon: selectedIcon })
      }
      const newAccount = await accountService.create(createData)
      onSuccess?.(newAccount)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
    >
      <UniversalModal
        key={isOpen ? 'open' : 'closed'} // сброс формы только при открытии
        isOpen={true}
        onClose={onClose}
        title="Создать новый счет"
        fields={fields}
        onSubmit={onSubmitForm}
        submitText="Создать счет"
        loading={loading}
        size="lg"
      >
        <div style={{ marginBottom: '1rem' }}>
          <div className={styles.pickerTitle}>Выберите иконку для счета</div>
          <IconPicker
            value={selectedIcon}
            onChange={setSelectedIcon}
          />
        </div>
      </UniversalModal>
    </ModalPortal>
  )
}
