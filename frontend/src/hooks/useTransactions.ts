'use client'

import { transactionService } from '@/services/transaction.services'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { IAccount } from '@/types/account.types'
import { ICreateTransaction, TransactionType } from '@/types/transaction.types'

export function useTransactions() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionService.getAll(),
    staleTime: 1000 * 30
  })

  const createMutation = useMutation({
    mutationFn: (data: ICreateTransaction) => transactionService.create(data),
    onMutate: async newTransactionData => {
      // 1. Отменяем текущие запросы для избежания конфликтов
      await queryClient.cancelQueries({ queryKey: ['transactions'] })
      await queryClient.cancelQueries({ queryKey: ['accounts'] })

      // 2. Сохраняем предыдущие данные для отката
      const previousTransactions = queryClient.getQueryData(['transactions'])
      const previousAccounts = queryClient.getQueryData(['accounts'])

      // 3. ОПТИМИСТИЧНОЕ ОБНОВЛЕНИЕ ТРАНЗАКЦИЙ
      const tempId = Date.now() // Временный ID
      const optimisticTransaction = {
        ...newTransactionData,
        id: tempId,
        transactionDate: newTransactionData.transactionDate, // Важно: сохраняем дату!
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      queryClient.setQueryData(['transactions'], (old: any[] = []) => [
        ...old,
        optimisticTransaction
      ])

      // 4. ОПТИМИСТИЧНОЕ ОБНОВЛЕНИЕ БАЛАНСА СЧЕТА
      queryClient.setQueryData(['accounts'], (old: IAccount[] = []) =>
        old.map(acc => {
          if (acc.id === newTransactionData.accountId) {
            const amountChange =
              newTransactionData.type === TransactionType.EXPENSE
                ? -newTransactionData.amount
                : newTransactionData.amount

            return {
              ...acc,
              currentBalance: acc.currentBalance + amountChange
            }
          }
          return acc
        })
      )

      // Возвращаем контекст для возможного отката
      return {
        previousTransactions,
        previousAccounts,
        tempId
      }
    },
    onError: (error: any, variables, context) => {
      // ОТКАТ при ошибке
      if (context?.previousTransactions) {
        queryClient.setQueryData(['transactions'], context.previousTransactions)
      }
      if (context?.previousAccounts) {
        queryClient.setQueryData(['accounts'], context.previousAccounts)
      }

      let errorMessage = 'Ошибка при создании транзакции'
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error?.message) {
        errorMessage = error.message
      }

      toast.error(errorMessage)
    },
    onSuccess: (createdTransaction, variables, context) => {
      // Заменяем оптимистичную транзакцию на реальную (с правильным ID от сервера)
      queryClient.setQueryData(['transactions'], (old: any[] = []) =>
        old.map(item =>
          item.id === context?.tempId ? createdTransaction : item
        )
      )

      // ФОРСИРУЕМ ОБНОВЛЕНИЕ ВСЕХ КОМПОНЕНТОВ
      // Инвалидируем ВСЁ, что зависит от транзакций
      queryClient.invalidateQueries({
        predicate: query => {
          const queryKey = query.queryKey[0]
          // Инвалидируем любые запросы, которые могут зависеть от транзакций
          return (
            queryKey === 'transactions' ||
            queryKey === 'accounts' ||
            queryKey === 'categories'
          )
        },
        refetchType: 'active'
      })

      toast.success('Транзакция успешно добавлена')
    },
    onSettled: () => {
      // Дополнительная гарантия актуальности
      queryClient.invalidateQueries({
        queryKey: ['transactions'],
        refetchType: 'inactive'
      })
    }
  })

  return {
    transactions: query.data ?? [],
    isLoading: query.isLoading,

    // Mutation
    createTransaction: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    refetch: () => queryClient.invalidateQueries({ queryKey: ['transactions'] })
  }
}
