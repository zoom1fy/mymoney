'use client'

import { categoryService } from '@/services/category.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { ICategory, ICreateCategory } from '@/types/category.types'

export function useCategories(isExpense: boolean) {
  const queryClient = useQueryClient()

  /** Активные категории */
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', isExpense],
    queryFn: () => categoryService.getAll(),
    staleTime: 1000 * 60
  })

  /** Архивные категории */
  const { data: archived = [] } = useQuery({
    queryKey: ['categories_archived'],
    queryFn: () => categoryService.getArchived(),
    staleTime: 1000 * 60
  })

  /** Создание */
  const createMutation = useMutation({
    mutationFn: (data: ICreateCategory) => categoryService.create(data),
    onSuccess: newCategory => {
      queryClient.setQueryData<ICategory[]>(['categories', isExpense], old => [
        ...(old ?? []),
        newCategory
      ])
      toast.success('Категория создана')
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Ошибка создания категории'
      toast.error(message)
    }
  })

  /** Обновление */
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ICreateCategory }) =>
      categoryService.update(id, data),
    onSuccess: updated => {
      queryClient.setQueryData<ICategory[]>(['categories', isExpense], old =>
        (old ?? []).map(c => (c.id === updated.id ? updated : c))
      )
      toast.success('Категория обновлена')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Ошибка обновления'
      toast.error(message)
    }
  })

  /** Архивация */
  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoryService.delete(id),
    onSuccess: (_, id) => {
      // удаляем из активных
      queryClient.setQueryData<ICategory[]>(['categories', isExpense], old =>
        (old ?? []).filter(c => c.id !== id)
      )
      // обновляем список архивных
      queryClient.invalidateQueries({ queryKey: ['categories_archived'] })

      toast.success('Категория перемещена в архив')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Ошибка архивирования'
      toast.error(message)
    }
  })

  /** Разархивация */
  const unarchiveMutation = useMutation({
    mutationFn: (id: number) => categoryService.unarchive(id),
    onSuccess: unarchived => {
      // убрали из архива
      queryClient.setQueryData<ICategory[]>(['categories_archived'], old =>
        (old ?? []).filter(c => c.id !== unarchived.id)
      )

      // вернули в активные
      queryClient.setQueryData<ICategory[]>(['categories', isExpense], old => [
        ...(old ?? []),
        unarchived
      ])

      toast.success('Категория восстановлена')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Ошибка восстановления'
      toast.error(message)
    }
  })

  return {
    /** активные */
    categories,
    isLoading,

    /** архивные */
    archived,

    /** CRUD */
    createCategory: createMutation.mutateAsync,
    updateCategory: updateMutation.mutateAsync,
    deleteCategory: deleteMutation.mutateAsync,
    unarchiveCategory: unarchiveMutation.mutateAsync,

    /** состояния */
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUnarchiving: unarchiveMutation.isPending
  }
}
