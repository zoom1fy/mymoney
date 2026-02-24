'use client'

import { accountService } from '@/services/account.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { IAccount, ICreateAccount, IUpdateAccount } from '@/types/account.types'

export function useAccounts() {
  const queryClient = useQueryClient()

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountService.getAll(),
    staleTime: 1000 * 60, // 1 минута
    select: (data) =>
      data.map((acc) => ({
        ...acc,
        currentBalance: Number(acc.currentBalance), // Парсим в число
      })),
  })

  const createMutation = useMutation({
    mutationFn: (data: ICreateAccount) => accountService.create(data),

    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['accounts'] })

      const previousAccounts = queryClient.getQueryData<IAccount[]>(['accounts'])

      const tempId = -Date.now()
      const optimisticAccount: IAccount = {
        id: tempId,
        ...newData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      queryClient.setQueryData<IAccount[]>(['accounts'], (old) => [
        ...(old || []),
        optimisticAccount,
      ])

      return { previousAccounts, tempId }
    },

    onError: (error: any, newData, context) => {
      if (context?.previousAccounts) {
        queryClient.setQueryData<IAccount[]>(['accounts'], context.previousAccounts)
      }
      const message =
        error?.response?.data?.message || error?.message || 'Ошибка создания счёта'
      toast.error(message)
    },

    onSuccess: (newAccount, variables, context) => {
      queryClient.setQueryData<IAccount[]>(['accounts'], (old) =>
        old?.map((acc) =>
          acc.id === context?.tempId
            ? {
                ...acc,
                ...newAccount,
                currentBalance: Number(newAccount.currentBalance), // Парсим в число
              }
            : acc
        )
      )
      toast.success('Счёт создан!')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: IUpdateAccount }) =>
      accountService.update(id, data),
    onSuccess: (updatedAccount) => {
      queryClient.setQueryData<IAccount[]>(['accounts'], (old) =>
        old?.map((acc) =>
          acc.id === updatedAccount.id
            ? {
                ...acc,
                ...updatedAccount,
                currentBalance: Number(updatedAccount.currentBalance), // Парсим в число
              }
            : acc
        )
      )
      toast.success('Счёт обновлён!')
    },

    onError: (error: any) => {
      const message =
        error?.response?.data?.message || error?.message || 'Ошибка обновления'
      toast.error(message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => accountService.delete(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<IAccount[]>(['accounts'], (old) =>
        old?.filter((acc) => acc.id !== id)
      )
      toast.success('Счёт удалён!')
    },
    onError: () => toast.error('Ошибка удаления'),
  })

  return {
    accounts,
    isLoading,

    createAccount: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    updateAccount: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    deleteAccount: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  }
}