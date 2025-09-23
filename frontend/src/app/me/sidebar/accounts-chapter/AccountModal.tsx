'use client'

import styles from './CreateAccountModal.module.scss'
import { ModalPortal } from './ModalPortal'
import { accountService } from '@/services/account.service'
import { confirmDialog } from '@/utils/confirm-dialog.utils'
import { FC, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { DeleteButton } from '@/components/ui/buttons/DeleteButton'
import { IconPicker } from '@/components/ui/modals/IconPicker'
import { UniversalModal } from '@/components/ui/modals/UniversalModal'
import { getAccountFields } from '@/components/ui/modals/accounts/account-fields.config'

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
    if (account?.icon) {
      setSelectedIcon(account.icon as AccountIconName)
    }
  }, [account])

  const fields = getAccountFields(account)

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
        toast.success('Счёт успешно обновлён!')
        onSuccess?.(updated)
        onClose() // ✅ закрываем только при успехе
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
        toast.success('Счёт успешно создан 🎉')
        onSuccess?.(created)
        onClose() // ✅ закрываем только при успехе
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Произошла ошибка при сохранении счёта ❌'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!account) return

    const result = await confirmDialog({
      title: 'Вы уверены?',
      text: 'Вы не сможете восстановить этот счёт!',
      confirmText: 'Да, удалить!',
      cancelText: 'Отмена'
    })

    if (result.isConfirmed) {
      setLoading(true)
      try {
        await accountService.delete(account.id)
        onSuccess?.()
        onClose()
        toast.success('Счёт успешно удалён')
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
        isOpen={isOpen}
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
