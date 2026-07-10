'use client'

import { removeTokenStorage } from '@/services/auth-token.service'
import { authService } from '@/services/auth.service'
import { userService } from '@/services/user.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function useProfile() {
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => userService.getProfile(),
    staleTime: 1000 * 60 * 5, // 5 минут
    retry: false
  })

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: async () => {
      // Очищаем все кэши react-query
      await queryClient.clear()

      toast.success('Вы вышли из системы')

      // Перенаправляем на страницу входа
      router.push('/auth')
      router.refresh()
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Ошибка при выходе'
      toast.error(message)

      // Даже если ошибка, попробуем очистить токен и выкинуть пользователя
      removeTokenStorage()
      router.push('/auth')
    }
  })

  const updateProfileMutation = useMutation({
    mutationFn: (data: {
      email?: string
      password?: string
      currentPassword: string
    }) => userService.updateProfile(data),
    onSuccess: async (updatedProfile: any) => {
      queryClient.setQueryData(['profile'], updatedProfile)
      toast.success('Профиль обновлён')
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Ошибка при обновлении профиля'
      toast.error(message)
    }
  })

  return {
    profile,
    isLoading,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending
  }
}
