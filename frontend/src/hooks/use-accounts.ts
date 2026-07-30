'use client'

import { accountService } from '@/services/account.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { IAccount, ICreateAccount, IUpdateAccount } from '@/types/account.type'

// API sends currentBalance as string; normalise to number on read + optimistic updates kept in sync
export function useAccounts() {
  const queryClient = useQueryClient()

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountService.getAll(),
    staleTime: 1000 * 60,
    select: data =>
      data.map(acc => ({
        ...acc,
        currentBalance: Number(acc.currentBalance)
      }))
  })

  const useAccountById = (id?: string | number) =>
    useQuery({
      queryKey: ['account', id],
      queryFn: () => accountService.getById(Number(id)),
      enabled: !!id,
      select: acc => ({
        ...acc,
        currentBalance: Number(acc.currentBalance)
      })
    })

  // Optimistic create: insert temp account instantly, swap with server response on success
  const createMutation = useMutation({
    mutationFn: (data: ICreateAccount) => accountService.create(data),

    onMutate: async newData => {
      await queryClient.cancelQueries({ queryKey: ['accounts'] })

      const previousAccounts = queryClient.getQueryData<IAccount[]>([
        'accounts'
      ])

      const tempId = -Date.now()
      const optimisticAccount: IAccount = {
        id: tempId,
        ...newData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeleted: false,
        currencySymbol: ''
      }

      queryClient.setQueryData<IAccount[]>(['accounts'], old => [
        ...(old || []),
        optimisticAccount
      ])

      return { previousAccounts, tempId }
    },

    onError: (error: Error, _newData, context) => {
      if (context?.previousAccounts) {
        queryClient.setQueryData<IAccount[]>(
          ['accounts'],
          context.previousAccounts
        )
      }
      const apiError = error as { response?: { data?: { message?: string } } }
      const message =
        apiError.response?.data?.message ||
        error.message ||
        'Ошибка создания счёта'
      toast.error(message)
    },

    onSuccess: (newAccount, variables, context) => {
      queryClient.setQueryData<IAccount[]>(['accounts'], old =>
        old?.map(acc =>
          acc.id === context?.tempId
            ? {
                ...acc,
                ...newAccount,
                currentBalance: Number(newAccount.currentBalance)
              }
            : acc
        )
      )
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Счёт создан!')
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: IUpdateAccount }) =>
      accountService.update(id, data),
    onSuccess: updatedAccount => {
      queryClient.setQueryData<IAccount[]>(['accounts'], old =>
        old?.map(acc =>
          acc.id === updatedAccount.id
            ? {
                ...acc,
                ...updatedAccount,
                currentBalance: Number(updatedAccount.currentBalance)
              }
            : acc
        )
      )
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Счёт обновлён!')
    },

    onError: (error: Error) => {
      const apiError = error as { response?: { data?: { message?: string } } }
      const message = apiError.response?.data?.message || error.message || 'Ошибка обновления'
      toast.error(message)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => accountService.delete(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<IAccount[]>(['accounts'], old =>
        old?.filter(acc => acc.id !== id)
      )
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Счёт удалён!')
    },
    onError: () => toast.error('Ошибка удаления')
  })

  return {
    accounts,
    isLoading,
    useAccountById,

    createAccount: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    updateAccount: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    deleteAccount: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending
  }
}
