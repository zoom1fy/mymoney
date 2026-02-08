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
    staleTime: 1000 * 60 // 1 минута
  })

  const createMutation = useMutation({
    mutationFn: (data: ICreateAccount) => accountService.create(data),

    onSuccess: newAccount => {
      queryClient.setQueryData(['accounts'], (old: IAccount[] | undefined) => [
        ...(old || []),
        newAccount
      ])
      toast.success('Счёт создан!')
    },

    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Ошибка создания счёта'

      toast.error(message)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: IUpdateAccount }) =>
      accountService.update(id, data),
    onSuccess: updatedAccount => {
      queryClient.setQueryData(['accounts'], (old: IAccount[] | undefined) =>
        old?.map(acc => (acc.id === updatedAccount.id ? updatedAccount : acc))
      )
      toast.success('Счёт обновлён!')
    },

    onError: (error: any) => {
      const message =
        error?.response?.data?.message || error?.message || 'Ошибка обновления'

      toast.error(message)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => accountService.delete(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData(['accounts'], (old: IAccount[] | undefined) =>
        old?.filter(acc => acc.id !== id)
      )
      toast.success('Счёт удалён!')
    },
    onError: () => toast.error('Ошибка удаления')
  })

  return {
    /** данные */
    accounts,
    isLoading,

    /** create */
    createAccount: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    /** update */
    updateAccount: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    /** delete */
    deleteAccount: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending
  }
}
