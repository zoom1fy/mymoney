'use client'

import { removeTokenStorage } from '@/services/auth-token.service'
import { authService } from '@/services/auth.service'
import { userService } from '@/services/user.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// Profile rarely changes (cached 5 min) and never retries — if token is bad just redirect
export function useProfile() {
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => userService.getProfile(),
    staleTime: 1000 * 60 * 5,
    retry: false
  })

  // On logout: wipe all query cache, remove token, redirect to /auth
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: async () => {
      await queryClient.clear()

      toast.success('Вы вышли из системы')

      router.push('/auth')
      router.refresh()
    },
    onError: (error: Error) => {
      const apiError = error as { response?: { data?: { message?: string } } }
      const message = apiError.response?.data?.message || 'Ошибка при выходе'
      toast.error(message)

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
    onSuccess: async (updatedProfile) => {
      queryClient.setQueryData(['profile'], updatedProfile)
      toast.success('Профиль обновлён')
    },
    onError: (error: Error) => {
      const apiError = error as { response?: { data?: { message?: string } } }
      const message = apiError.response?.data?.message || 'Ошибка при обновлении профиля'
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
