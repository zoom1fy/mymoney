'use client'

import { DASHBOARD_PAGES } from '@/config/pages-url.config'
import { authService } from '@/services/auth.service'
import { useMutation } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
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

interface IAuthFormExtended extends IAuthForm {
  confirmPassword: string
}

export function Auth() {
  const [type, setType] = useState<AuthType>('register')
  const router = useRouter()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<IAuthFormExtended>({ mode: 'onChange' })

  const { mutate: authenticate, isPending } = useMutation({
    mutationKey: ['auth'],
    mutationFn: (data: IAuthForm) => authService.main(type, data),
    onSuccess() {
      toast.success(
        type === 'login' ? 'Добро пожаловать!' : 'Аккаунт успешно создан!'
      )
      reset()
      router.push(DASHBOARD_PAGES.HOME)
      router.refresh()
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

  const onSubmit: SubmitHandler<IAuthFormExtended> = data => {
    if (type === 'register' && data.password !== data.confirmPassword) {
      toast.error('Пароли не совпадают')
      return
    }
    authenticate({ email: data.email, password: data.password })
  }

  const passwordValue = watch('password')

  const toggleAuthType = () => {
    setType(prev => (prev === 'login' ? 'register' : 'login'))
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">
      {/* ФОН */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[1000px] w-[1000px] rounded-full bg-accent/20 blur-3xl animate-pulse-slow" />
        <div className="absolute -left-48 top-0 h-[800px] w-[800px] rounded-full bg-accent/15 blur-3xl animate-float" />
        <div className="absolute -right-64 bottom-0 h-[900px] w-[900px] rounded-full bg-accent/10 blur-3xl animate-float-delayed" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-background/60 to-background/80" />
      </div>

      <div className="flex min-h-screen items-center justify-center px-6">
        <GlassCard className="w-full max-w-lg rounded-3xl border p-12 shadow-2xl backdrop-blur-xl overflow-hidden">
          <div className="text-center mb-10">
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
              {type === 'login'
                ? 'Войдите, чтобы продолжить управление финансами'
                : 'Создайте аккаунт и обретите спокойствие с деньгами'}
            </p>
          </div>

          <motion.form
            layout
            className="space-y-8"
            transition={{ duration: 0.75, ease: [0.4, 0, 0.2, 1] }}
            onSubmit={handleSubmit(onSubmit)}
          >
            {/* Email */}
            <motion.div
              layout
              transition={{ duration: 0.4 }}
            >
              <Label
                className="text-lg font-medium"
                htmlFor="email"
              >
                Email
              </Label>
              <Input
                className="mt-3 h-14 text-lg px-5"
                id="email"
                placeholder="you@example.com"
                type="email"
                {...register('email', {
                  required: 'Email обязателен',
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: 'Введите корректный email'
                  }
                })}
              />
              <ErrorMessage error={errors.email?.message} />
            </motion.div>

            {/* Пароль */}
            <motion.div
              layout
              transition={{ duration: 0.4 }}
            >
              <Label
                className="text-lg font-medium"
                htmlFor="password"
              >
                Пароль
              </Label>
              <Input
                autoComplete={
                  type === 'login' ? 'current-password' : 'new-password'
                }
                className="mt-3 h-14 text-lg px-5"
                id="password"
                placeholder="••••••••"
                type="password"
                {...register('password', {
                  required: 'Пароль обязателен',
                  minLength: { value: 6, message: 'Минимум 6 символов' }
                })}
              />
              <ErrorMessage error={errors.password?.message} />
            </motion.div>

            {/* Confirm Password */}
            <AnimatePresence mode="sync">
              {type === 'register' && (
                <motion.div
                  layout
                  animate={{ opacity: 1, height: 100, marginTop: 0 }}
                  exit={{ opacity: 0, height: 0, marginTop: -30 }}
                  initial={{ opacity: 0, height: 0, marginTop: 50 }}
                  transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                >
                  <Label
                    className="text-lg font-medium"
                    htmlFor="confirmPassword"
                  >
                    Повторите пароль
                  </Label>
                  <Input
                    className="mt-3 h-14 text-lg px-5"
                    id="confirmPassword"
                    placeholder="••••••••"
                    type="password"
                    {...register('confirmPassword', {
                      required: 'Повтор пароля обязателен',
                      validate: value =>
                        value === passwordValue || 'Пароли не совпадают'
                    })}
                  />
                  <ErrorMessage error={errors.confirmPassword?.message} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Кнопка */}
            <motion.div
              layout
              transition={{ duration: 0.5 }}
            >
              <AccentButton
                className="w-full h-14 text-lg font-medium"
                disabled={isPending}
                size="lg"
                type="submit"
              >
                {isPending
                  ? 'Подождите...'
                  : type === 'login'
                    ? 'Войти'
                    : 'Создать аккаунт'}
              </AccentButton>
            </motion.div>
          </motion.form>

          {/* Переключение */}
          <div className="mt-10 text-center">
            <p className="text-lg text-muted-foreground">
              {type === 'login' ? 'Ещё нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
              <button
                className="font-semibold text-accent hover:underline transition-colors"
                type="button"
                onClick={toggleAuthType}
              >
                {type === 'login' ? 'Зарегистрироваться' : 'Войти'}
              </button>
            </p>
          </div>

          <div className="mt-8 text-center">
            <Link
              className="text-base text-muted-foreground hover:text-foreground transition-colors"
              href="/"
            >
              ← Вернуться на главную
            </Link>
          </div>
        </GlassCard>
      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 0.85;
            transform: scale(1.08);
          }
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-35px);
          }
        }
        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(35px);
          }
        }
      `}</style>
    </div>
  )
}

function ErrorMessage({ error }: { error?: string }) {
  if (!error) return null
  return (
    <motion.p
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-2 text-base text-destructive"
      exit={{ opacity: 0, height: 0 }}
      initial={{ opacity: 0, height: 0 }}
    >
      {error}
    </motion.p>
  )
}
