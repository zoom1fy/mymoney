'use client'

import { transactionService } from '@/services/transaction.service'
import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient
} from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { DonutItem } from '@/lib/transactions-donut'
import { IAccount } from '@/types/account.type'
import {
  ICreateTransaction,
  ITransaction,
  ITransactionResponse,
  TransactionType
} from '@/types/transaction.type'

export function useTransactionsForPeriod(from: Date, to: Date, enabled = true) {
  return useQuery<ITransaction[]>({
    queryKey: ['transactions-period', from.toISOString(), to.toISOString()],
    queryFn: () => transactionService.getForPeriod(from, to),
    staleTime: 1000 * 60,
    enabled
  })
}

export function useTransactionSummary(from: Date, to: Date, type: TransactionType) {
  return useQuery<DonutItem[]>({
    queryKey: ['transactions-summary', from.toISOString(), to.toISOString(), type],
    queryFn: () => transactionService.getSummary(from, to, type),
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
      await queryClient.cancelQueries({ queryKey: ['transactions'] })
      await queryClient.cancelQueries({ queryKey: ['accounts'] })

      const previousTransactions = queryClient.getQueryData(['transactions'])
      const previousAccounts = queryClient.getQueryData(['accounts'])

      const tempId = Date.now()
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

      return {
        previousTransactions,
        previousAccounts,
        tempId
      }
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(['transactions'], context.previousTransactions)
      }
      if (context?.previousAccounts) {
        queryClient.setQueryData(['accounts'], context.previousAccounts)
      }

      const apiError = error as { response?: { data?: { message?: string } } }
      let errorMessage = 'Ошибка при создании транзакции'
      if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message
      } else if (error.message) {
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
          const key = query.queryKey[0]
          return key === 'accounts' || key === 'transactions-period'
        },
        refetchType: 'active'
      })

      toast.success('Транзакция успешно добавлена')
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ICreateTransaction }) =>
      transactionService.update(id, data),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['transactions'] })
      await queryClient.cancelQueries({ queryKey: ['accounts'] })

      const previousTransactions = queryClient.getQueryData(['transactions'])
      const previousAccounts = queryClient.getQueryData(['accounts'])

      queryClient.setQueryData<InfiniteData<ITransactionResponse>>(
        ['transactions'],
        old => {
          if (!old) return old

          return {
            ...old,
            pages: old.pages.map(page => ({
              ...page,
              data: page.data.map(item =>
                item.id === id ? { ...item, ...data, id: item.id } : item
              )
            }))
          }
        }
      )

      return { previousTransactions, previousAccounts }
    },

    onError: (error: Error, _variables, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(['transactions'], context.previousTransactions)
      }
      if (context?.previousAccounts) {
        queryClient.setQueryData(['accounts'], context.previousAccounts)
      }

      const apiError = error as { response?: { data?: { message?: string } } }
      toast.error(apiError.response?.data?.message || 'Ошибка обновления')
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: query => {
          const key = query.queryKey[0]
          return key === 'accounts' || key === 'transactions-period'
        },
        refetchType: 'active'
      })

      toast.success('Транзакция обновлена')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => transactionService.delete(id),

    onMutate: async id => {
      await queryClient.cancelQueries({ queryKey: ['transactions'] })
      await queryClient.cancelQueries({ queryKey: ['accounts'] })

      const previousTransactions = queryClient.getQueryData(['transactions'])
      const previousAccounts = queryClient.getQueryData(['accounts'])

      let deletedTransaction: ITransaction | undefined

      queryClient.setQueryData<InfiniteData<ITransactionResponse>>(
        ['transactions'],
        old => {
          if (!old) return old

          let found: ITransaction | undefined
          const newPages = old.pages.map(page => ({
            ...page,
            data: page.data.filter(item => {
              if (item.id === id) {
                found = item
                return false
              }
              return true
            })
          }))

          deletedTransaction = found

          return { ...old, pages: newPages }
        }
      )

      if (deletedTransaction) {
        queryClient.setQueryData(['accounts'], (old: IAccount[] = []) =>
          old.map(acc => {
            if (acc.id === deletedTransaction!.accountId) {
              const revertAmount =
                deletedTransaction!.type === TransactionType.EXPENSE
                  ? deletedTransaction!.amount
                  : -deletedTransaction!.amount

              return {
                ...acc,
                currentBalance: acc.currentBalance + revertAmount
              }
            }
            return acc
          })
        )
      }

      return { previousTransactions, previousAccounts }
    },

    onError: (error: Error, _variables, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(['transactions'], context.previousTransactions)
      }
      if (context?.previousAccounts) {
        queryClient.setQueryData(['accounts'], context.previousAccounts)
      }

      const apiError = error as { response?: { data?: { message?: string } } }
      toast.error(apiError.response?.data?.message || 'Ошибка удаления')
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: query => {
          const key = query.queryKey[0]
          return key === 'accounts' || key === 'transactions-period'
        },
        refetchType: 'active'
      })

      toast.success('Транзакция удалена')
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
