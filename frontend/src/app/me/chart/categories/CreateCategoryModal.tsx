'use client'

import { categoryService } from '@/services/category.service'
import { useState } from 'react'

import { IconPicker } from '@/components/ui/modals/IconPicker'
import { UniversalModal } from '@/components/ui/modals/UniversalModal'
import { getCategoryFields } from '@/components/ui/modals/categories/category-fields.config'

import { CurrencyCode } from '@/types/account.types'
import {
  CategoryIconName,
  CategoryIcons,
  ICategory
} from '@/types/category.types'

interface CreateCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  isExpense: boolean
  onCategoryCreated: (category: ICategory) => void
  category?: ICategory // если нужно редактировать
}

export function CreateCategoryModal({
  isOpen,
  onClose,
  isExpense,
  onCategoryCreated,
  category
}: CreateCategoryModalProps) {
  const [loading, setLoading] = useState(false)
  const [selectedIcon, setSelectedIcon] = useState<CategoryIconName>(
    category?.icon || 'Circle'
  )

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true)
      const newCategory = await categoryService.create({
        name: data.name,
        currencyCode: CurrencyCode.RUB,
        isExpense,
        icon: selectedIcon
      })
      onCategoryCreated(newCategory)
      onClose()
    } catch (error: any) {
      console.error('Ошибка при создании категории:', error)
      const message =
        error?.response?.data?.message ||
        'Произошла ошибка при создании категории'
      // Вызываем тостер (например, sonner)
      import('sonner').then(({ toast }) => toast.error(message))
    } finally {
      setLoading(false)
    }
  }

  const fields = getCategoryFields(category)

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? 'Редактировать категорию' : 'Создать новую категорию'}
      loading={loading}
      fields={fields.filter(f => f.name !== 'icon')} // убираем поле иконки, т.к. IconPicker
      onSubmit={handleSubmit}
      submitText={category ? 'Сохранить изменения' : 'Добавить'}
      cancelText="Отмена"
    >
      {/* Иконка через IconPicker */}
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
    </UniversalModal>
  )
}
