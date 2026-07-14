'use client'

import { categoryService } from '@/services/category.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { ICategory, ICreateCategory } from '@/types/category.type'

// Active + archived are fetched separately so the UI can show/hide archived categories
export function useCategories(isExpense: boolean) {
  const queryClient = useQueryClient()

  /** Active categories (visible in dropdowns and panel) */
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', isExpense],
    queryFn: () => categoryService.getAll(),
    staleTime: 1000 * 60
  })

  /** Soft-deleted categories available for unarchive */
  const { data: archived = [] } = useQuery({
    queryKey: ['categories_archived'],
    queryFn: () => categoryService.getArchived(),
    staleTime: 1000 * 60
  })

  /** Create a new category and add it to the active list optimistically */
  const createMutation = useMutation({
    mutationFn: (data: ICreateCategory) => categoryService.create(data),
    onSuccess: newCategory => {
      queryClient.setQueryData<ICategory[]>(['categories', isExpense], old => [
        ...(old ?? []),
        newCategory
      ])
      toast.success('Категория создана')
    },
    onError: (error: Error) => {
      const err = error as { response?: { data?: { message?: string } } }
      const message = err.response?.data?.message || 'Ошибка создания категории'
      toast.error(message)
    }
  })

  /** Update category in-place without refetch */
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ICreateCategory }) =>
      categoryService.update(id, data),
    onSuccess: updated => {
      queryClient.setQueryData<ICategory[]>(['categories', isExpense], old =>
        (old ?? []).map(c => (c.id === updated.id ? updated : c))
      )
      toast.success('Категория обновлена')
    },
    onError: (error: Error) => {
      const err = error as { response?: { data?: { message?: string } } }
      const message = err.response?.data?.message || 'Ошибка обновления'
      toast.error(message)
    }
  })

  /** Archive: remove from active list and refresh the archived list */
  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoryService.delete(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<ICategory[]>(['categories', isExpense], old =>
        (old ?? []).filter(c => c.id !== id)
      )
      queryClient.invalidateQueries({ queryKey: ['categories_archived'] })

      toast.success('Категория перемещена в архив')
    },
    onError: (error: Error) => {
      const err = error as { response?: { data?: { message?: string } } }
      const message = err.response?.data?.message || 'Ошибка архивирования'
      toast.error(message)
    }
  })

  /** Unarchive: move from archived list back to active */
  const unarchiveMutation = useMutation({
    mutationFn: (id: number) => categoryService.unarchive(id),
    onSuccess: unarchived => {
      queryClient.setQueryData<ICategory[]>(['categories_archived'], old =>
        (old ?? []).filter(c => c.id !== unarchived.id)
      )

      queryClient.setQueryData<ICategory[]>(['categories', isExpense], old => [
        ...(old ?? []),
        unarchived
      ])

      toast.success('Категория восстановлена')
    },
    onError: (error: Error) => {
      const err = error as { response?: { data?: { message?: string } } }
      const message = err.response?.data?.message || 'Ошибка восстановления'
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
