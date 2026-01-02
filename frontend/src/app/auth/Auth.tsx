'use client'

import { DASHBOARD_PAGES } from '@/config/pages-url.config'
import { authService } from '@/services/auth.service'
import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { AccentButton } from '@/components/ui/buttons/accent-button'
import { GlassCard } from '@/components/ui/cards/glass-card'
import { Input } from '@/components/ui/shadui/input'
import { Label } from '@/components/ui/shadui/label'

import { IAuthForm } from '@/types/auth.types'

type AuthType = 'login' | 'register'

export function Auth() {
  const [type, setType] = useState<AuthType>('login')
  const router = useRouter()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<IAuthForm>({
    mode: 'onChange'
  })

  const { mutate: authenticate, isPending } = useMutation({
    mutationKey: ['auth'],
    mutationFn: (data: IAuthForm) => authService.main(type, data),
    onSuccess() {
      toast.success(
        type === 'login' ? 'Добро пожаловать!' : 'Аккаунт успешно создан!'
      )
      reset()
      router.push(DASHBOARD_PAGES.HOME)
    },
    onError(error: any) {
      const message =
        error?.response?.data?.message ||
        (type === 'login'
          ? 'Неверный email или пароль'
          : 'Ошибка при регистрации')
      toast.error(message)
    }
  })

  const onSubmit: SubmitHandler<IAuthForm> = data => {
    authenticate(data)
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">
      {/* Улучшенный многослойный фон с анимацией */}
      <div className="absolute inset-0 -z-10">
        {/* Основной большой центральный blob */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[1000px] w-[1000px] rounded-full bg-accent/25 blur-3xl animate-pulse-slow" />

        {/* Боковые акценты */}
        <div className="absolute -left-48 top-0 h-[800px] w-[800px] rounded-full bg-accent/20 blur-3xl animate-float" />
        <div className="absolute -right-64 bottom-0 h-[900px] w-[900px] rounded-full bg-accent/15 blur-3xl animate-float-delayed" />

        {/* Лёгкий градиентный оверлей для глубины */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-background/50 to-background/70" />
      </div>

      {/* Центральная карточка */}
      <div className="flex min-h-screen items-center justify-center px-6">
        <GlassCard className="w-full max-w-lg rounded-3xl border p-12 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-12">
            <p className="mt-6 text-xl md:text-2xl text-muted-foreground">
              {type === 'login'
                ? 'Войдите, чтобы продолжить управление финансами'
                : 'Создайте аккаунт и обретите спокойствие с деньгами'}
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-8"
          >
            <div>
              <Label
                htmlFor="email"
                className="text-lg font-medium"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className="mt-3 h-14 text-lg px-5"
                {...register('email', {
                  required: 'Email обязателен',
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: 'Введите корректный email'
                  }
                })}
              />
              {errors.email && (
                <p className="mt-2 text-base text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="password"
                className="text-lg font-medium"
              >
                Пароль
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete={
                  type === 'login' ? 'current-password' : 'new-password'
                }
                className="mt-3 h-14 text-lg px-5"
                {...register('password', {
                  required: 'Пароль обязателен',
                  minLength: {
                    value: 6,
                    message: 'Минимум 6 символов'
                  }
                })}
              />
              {errors.password && (
                <p className="mt-2 text-base text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <AccentButton
              type="submit"
              size="lg"
              className="w-full h-14 text-lg font-medium"
              disabled={isPending}
            >
              {isPending
                ? 'Подождите...'
                : type === 'login'
                  ? 'Войти'
                  : 'Создать аккаунт'}
            </AccentButton>
          </form>

          {/* Переключатель */}
          <div className="mt-10 text-center">
            <p className="text-lg text-muted-foreground">
              {type === 'login' ? 'Ещё нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
              <button
                type="button"
                onClick={() => setType(type === 'login' ? 'register' : 'login')}
                className="font-semibold text-accent hover:underline focus:outline-none transition"
              >
                {type === 'login' ? 'Зарегистрироваться' : 'Войти'}
              </button>
            </p>
          </div>

          {/* Ссылка на главную */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-base text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Вернуться на главную
            </Link>
          </div>
        </GlassCard>
      </div>

      {/* Анимации */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-40px) translateX(30px);
          }
        }
        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(40px) translateX(-30px);
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 12s ease-in-out infinite;
        }
        .animate-float {
          animation: float 18s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 20s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
