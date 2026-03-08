'use client'

import { transactionService } from '@/services/transaction.services'
import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient
} from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { IAccount } from '@/types/account.types'
import {
  ICreateTransaction,
  ITransaction,
  ITransactionResponse,
  TransactionType
} from '@/types/transaction.types'

export function useTransactionsForPeriod(from: Date, to: Date) {
  return useQuery<ITransaction[]>({
    queryKey: ['transactions-period', from.toISOString(), to.toISOString()],
    queryFn: () => transactionService.getForPeriod(from, to),
    staleTime: 1000 * 60
  })
}

export function useTransactions() {
  const queryClient = useQueryClient()

  const query = useInfiniteQuery({
    queryKey: ['transactions'],

    queryFn: ({ pageParam }) =>
      transactionService.getAll(pageParam as number | undefined),

    initialPageParam: undefined as number | undefined,

    getNextPageParam: lastPage => lastPage.nextCursor ?? undefined,

    staleTime: 1000 * 30
  })

  const transactions = query.data?.pages.flatMap(page => page.data) ?? []

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
      const optimisticTransaction: ITransaction = {
        ...newTransactionData,
        id: tempId,
        transactionDate:
          newTransactionData.transactionDate ?? new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      queryClient.setQueryData<InfiniteData<ITransactionResponse>>(
        ['transactions'],
        old => {
          if (!old) return old

          return {
            ...old,
            pages: old.pages.map((page, index) => {
              if (index === 0) {
                return {
                  ...page,
                  data: [optimisticTransaction, ...page.data]
                }
              }
              return page
            })
          }
        }
      )

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
      queryClient.setQueryData<InfiniteData<ITransactionResponse>>(
        ['transactions'],
        old => {
          if (!old) return old

          return {
            ...old,
            pages: old.pages.map(page => ({
              ...page,
              data: page.data.map(item =>
                item.id === context?.tempId ? createdTransaction : item
              )
            }))
          }
        }
      )

      queryClient.invalidateQueries({
        predicate: query => {
          const queryKey = query.queryKey[0]
          return (
            queryKey === 'transactions' ||
            queryKey === 'transactions-period' ||
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
        predicate: query => {
          const queryKey = query.queryKey[0]
          return (
            queryKey === 'transactions' || queryKey === 'transactions-period'
          )
        },
        refetchType: 'inactive'
      })
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ICreateTransaction }) =>
      transactionService.update(id, data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: query => {
          const queryKey = query.queryKey[0]
          return (
            queryKey === 'transactions' ||
            queryKey === 'transactions-period' ||
            queryKey === 'accounts' ||
            queryKey === 'categories'
          )
        },
        refetchType: 'active'
      })
      toast.success('Транзакция обновлена')
    },

    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Ошибка обновления')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => transactionService.delete(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: query => {
          const queryKey = query.queryKey[0]
          return (
            queryKey === 'transactions' ||
            queryKey === 'transactions-period' ||
            queryKey === 'accounts' ||
            queryKey === 'categories'
          )
        },
        refetchType: 'active'
      })
      toast.success('Транзакция удалена')
    },

    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Ошибка удаления')
    }
  })

  return {
    transactions,
    isLoading: query.isLoading,

    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,

    createTransaction: createMutation.mutateAsync,
    updateTransaction: updateMutation.mutateAsync,
    deleteTransaction: deleteMutation.mutateAsync,

    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  }
}
