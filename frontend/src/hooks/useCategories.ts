'use client'

import { categoryService } from '@/services/category.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { ICategory, ICreateCategory } from '@/types/category.types'

export function useCategories(isExpense: boolean) {
  const queryClient = useQueryClient()

  /** 📥 Получение категорий */
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
    staleTime: 1000 * 60
  })

  /** ➕ Создание */
  const createMutation = useMutation({
    mutationFn: (data: ICreateCategory) => categoryService.create(data),

    onSuccess: newCategory => {
      queryClient.setQueryData<ICategory[]>(['categories'], old => [
        ...(old ?? []),
        newCategory
      ])

      toast.success('Категория создана')
    },

    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Ошибка создания категории'

      toast.error(message)
    }
  })

  /** ✏️ Обновление */
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ICreateCategory }) =>
      categoryService.update(id, data),

    onSuccess: updatedCategory => {
      queryClient.setQueryData<ICategory[]>(['categories'], old =>
        (old ?? []).map(cat =>
          cat.id === updatedCategory.id ? updatedCategory : cat
        )
      )

      toast.success('Категория обновлена')
    },

    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Ошибка обновления категории'

      toast.error(message)
    }
  })

  /** 🗑 Удаление */
  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoryService.delete(id),

    onSuccess: (_, id) => {
      queryClient.setQueryData<ICategory[]>(['categories'], old =>
        (old ?? []).filter(cat => cat.id !== id)
      )

      toast.success('Категория удалена')
    },

    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Ошибка удаления категории'

      toast.error(message)
    }
  })

  return {
    /** данные */
    categories: categories.filter(c => c.isExpense === isExpense),
    isLoading,

    /** create */
    createCategory: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    /** update */
    updateCategory: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    /** delete */
    deleteCategory: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending
  }
}
