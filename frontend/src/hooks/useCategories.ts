'use client'

import { categoryService } from '@/services/category.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ICategory, ICreateCategory } from '@/types/category.types'

export function useCategories(isExpense: boolean) {
  const queryClient = useQueryClient()

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
    staleTime: 1000 * 60
  })

  const createMutation = useMutation({
    mutationFn: (data: ICreateCategory) => categoryService.create(data),

    onSuccess: newCategory => {
      queryClient.setQueryData<ICategory[]>(
        ['categories'],
        old => [...(old ?? []), newCategory]
      )

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

  return {
    categories: categories.filter(c => c.isExpense === isExpense),
    isLoading,
    createCategory: createMutation.mutateAsync,
    isCreating: createMutation.isPending
  }
}
