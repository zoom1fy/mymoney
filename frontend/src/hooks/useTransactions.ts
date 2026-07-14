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

// Non-infinite query for bounded period (donut chart, transaction list modal)
export function useTransactionsForPeriod(from: Date, to: Date) {
  return useQuery<ITransaction[]>({
    queryKey: ['transactions-period', from.toISOString(), to.toISOString()],
    queryFn: () => transactionService.getForPeriod(from, to),
    staleTime: 1000 * 60
  })
}

// Infinite-scroll transaction list with optimistic create (updates both tx list + account balance)
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

      // Prepend optimistic transaction to the first (most recent) page
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

      // Optimistically adjust the affected account's balance
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

      const err = error as { response?: { data?: { message?: string } } }
      let errorMessage = 'Ошибка при создании транзакции'
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
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
      // Also refresh stale period queries in the background after any transaction mutation
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

    onError: (error: Error) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Ошибка обновления')
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

    onError: (error: Error) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Ошибка удаления')
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
