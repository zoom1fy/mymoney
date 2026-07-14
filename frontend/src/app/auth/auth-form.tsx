'use client'

import { DASHBOARD_PAGES } from '@/config/pages-url.config'
import { authService } from '@/services/auth.service'
import { useMutation } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Mail, Check } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { AccentButton } from '@/components/ui/buttons/accent-button'
import { GlassCard } from '@/components/ui/cards/glass-card'
import { Input } from '@/components/ui/shadui/input'
import { Label } from '@/components/ui/shadui/label'

import { IAuthForm } from '@/types/auth.type'

type AuthType = 'login' | 'register'

interface IAuthFormExtended extends IAuthForm {
  confirmPassword: string
}

function AuthForm({
  type,
  loginMutation,
  registerMutation,
  onSubmit
}: {
  type: AuthType
  loginMutation: { isPending: boolean }
  registerMutation: { isPending: boolean }
  onSubmit: SubmitHandler<IAuthFormExtended>
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<IAuthFormExtended>({ mode: 'onChange' })
  const passwordValue = watch('password')

  return (
    <motion.form
      layout
      className="space-y-8"
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      onSubmit={handleSubmit(onSubmit)}
    >
      <motion.div layout>
        <Label className="text-lg font-medium" htmlFor="email">
          Email
        </Label>
        <Input
          className="mt-3 h-14 text-lg px-5 transition-shadow duration-300 focus-visible:shadow-[0_0_0_3px_hsl(var(--ring)/0.3)]"
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

      <motion.div layout>
        <Label className="text-lg font-medium" htmlFor="password">
          Пароль
        </Label>
        <Input
          autoComplete={type === 'login' ? 'current-password' : 'new-password'}
          className="mt-3 h-14 text-lg px-5 transition-shadow duration-300 focus-visible:shadow-[0_0_0_3px_hsl(var(--ring)/0.3)]"
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

      <AnimatePresence mode="sync">
        {type === 'register' && (
          <motion.div
            animate={{ opacity: 1, height: 100, marginTop: 0 }}
            exit={{ opacity: 0, height: 0, marginTop: -30 }}
            initial={{ opacity: 0, height: 0, marginTop: 50 }}
            key="confirm"
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <Label className="text-lg font-medium" htmlFor="confirmPassword">
              Повторите пароль
            </Label>
            <Input
              className="mt-3 h-14 text-lg px-5 transition-shadow duration-300 focus-visible:shadow-[0_0_0_3px_hsl(var(--ring)/0.3)]"
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

      <motion.div layout>
        <AccentButton
          className="w-full h-14 text-lg font-medium transition-transform duration-200 active:scale-[0.98]"
          disabled={loginMutation.isPending || registerMutation.isPending}
          size="lg"
          type="submit"
        >
          {loginMutation.isPending || registerMutation.isPending ? (
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              className="inline-block"
              transition={{ duration: 1, repeat: Infinity }}
            >
              Подождите...
            </motion.span>
          ) : type === 'login' ? (
            'Войти'
          ) : (
            'Создать аккаунт'
          )}
        </AccentButton>
      </motion.div>
    </motion.form>
  )
}

function VerifyScreen({
  email,
  onVerify,
  onBack,
  resendMutation,
  cooldown,
  verifyMutation,
  setCooldown
}: {
  email: string
  onVerify: (e: React.FormEvent<HTMLFormElement>) => void
  onBack: () => void
  resendMutation: { isPending: boolean; mutate: (email: string) => void }
  cooldown: number
  verifyMutation: { isPending: boolean; isError: boolean }
  setCooldown: (n: number) => void
}) {
  const [code, setCode] = useState('')
  const [shake, setShake] = useState(false)

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  useEffect(() => {
    if (verifyMutation.isError) triggerShake()
  }, [verifyMutation.isError])

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-8"
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20"
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <Mail className="h-8 w-8 text-accent" />
      </motion.div>

      <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
        Код подтверждения отправлен на
      </p>
      <p className="mt-2 text-lg font-semibold text-foreground">{email}</p>

      <form className="mt-8 space-y-8" onSubmit={onVerify}>
        <div>
          <Label className="text-lg font-medium" htmlFor="code">
            Введите код из письма
          </Label>
          <motion.div
            animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <Input
              autoComplete="one-time-code"
              className={`mt-3 h-14 text-2xl text-center tracking-[0.5em] px-5 transition-all duration-300 ${
                shake
                  ? 'border-destructive shadow-[0_0_0_3px_hsl(var(--destructive)/0.3)]'
                  : 'focus-visible:shadow-[0_0_0_3px_hsl(var(--ring)/0.3)]'
              }`}
              id="code"
              inputMode="numeric"
              maxLength={6}
              name="code"
              placeholder="000000"
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            />
          </motion.div>
        </div>

        <motion.div
          animate={verifyMutation.isPending ? { scale: 0.98 } : { scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <AccentButton
            className="w-full h-14 text-lg font-medium transition-transform duration-200 active:scale-[0.98]"
            disabled={verifyMutation.isPending || code.length !== 6}
            size="lg"
            type="submit"
          >
            {verifyMutation.isPending ? (
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                className="inline-block"
                transition={{ duration: 1, repeat: Infinity }}
              >
                Проверяем...
              </motion.span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Check className="h-5 w-5" />
                Подтвердить
              </span>
            )}
          </AccentButton>
        </motion.div>
      </form>

      <div className="mt-8 text-center space-y-4">
        <motion.button
          className="text-base text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          disabled={resendMutation.isPending || cooldown > 0}
          type="button"
          whileTap={cooldown === 0 ? { scale: 0.95 } : {}}
          onClick={() => {
            resendMutation.mutate(email)
            setCooldown(60)
          }}
        >
          {resendMutation.isPending
            ? 'Отправляем...'
            : cooldown > 0
              ? `Отправить код заново (${cooldown}с)`
              : 'Отправить код заново'}
        </motion.button>

        <div>
          <motion.button
            className="inline-flex items-center gap-2 text-base text-muted-foreground hover:text-foreground transition-colors"
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Назад к регистрации
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// Pending email means user just registered and must verify before proceeding
// cooldown controls the resend-code button countdown
export function Auth() {
  const [type, setType] = useState<AuthType>('register')
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown(prev => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const loginMutation = useMutation({
    mutationKey: ['login'],
    mutationFn: (data: IAuthForm) => authService.login(data),
    onSuccess() {
      toast.success('Добро пожаловать!')
      router.push(DASHBOARD_PAGES.HOME)
      router.refresh()
    },
    onError(error: Error) {
      const err = error as { response?: { data?: { message?: string } } }
      const message = err.response?.data?.message || 'Неверный email или пароль'
      toast.error(message)
    }
  })

  const registerMutation = useMutation({
    mutationKey: ['register'],
    mutationFn: (data: IAuthForm) => authService.register(data),
    onSuccess(data) {
      toast.success('Код отправлен на почту!')
      setPendingEmail(data.data.email)
      setCooldown(60)
    },
    onError(error: Error) {
      const err = error as { response?: { data?: { message?: string } } }
      const message = err.response?.data?.message || 'Ошибка при регистрации'
      toast.error(message)
    }
  })

  const verifyMutation = useMutation({
    mutationKey: ['verify-email'],
    mutationFn: (data: { email: string; code: string }) =>
      authService.verifyEmail(data),
    onSuccess() {
      toast.success('Аккаунт подтверждён!')
      setPendingEmail(null)
      router.push(DASHBOARD_PAGES.HOME)
      router.refresh()
    },
    onError(error: Error) {
      const err = error as { response?: { data?: { message?: string } } }
      const message = err.response?.data?.message || 'Неверный код'
      toast.error(message)
    }
  })

  const resendMutation = useMutation({
    mutationKey: ['resend-code'],
    mutationFn: (email: string) => authService.resendCode(email),
    onSuccess() {
      toast.success('Новый код отправлен на почту')
    },
    onError(error: Error) {
      const err = error as { response?: { data?: { message?: string } } }
      const message = err.response?.data?.message || 'Ошибка при отправке кода'
      toast.error(message)
    }
  })

  const onSubmit: SubmitHandler<IAuthFormExtended> = data => {
    if (type === 'login') {
      loginMutation.mutate({ email: data.email, password: data.password })
      return
    }
    if (data.password !== data.confirmPassword) {
      toast.error('Пароли не совпадают')
      return
    }
    registerMutation.mutate({ email: data.email, password: data.password })
  }

  const onVerify = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const code = formData.get('code') as string
    if (!code || code.length !== 6) {
      toast.error('Введите код из 6 цифр')
      return
    }
    verifyMutation.mutate({ email: pendingEmail!, code })
  }

  const toggleAuthType = () => {
    setType(prev => (prev === 'login' ? 'register' : 'login'))
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">
      {/* Animated background blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[1000px] w-[1000px] rounded-full bg-accent/20 blur-3xl animate-pulse-slow" />
        <div className="absolute -left-48 top-0 h-[800px] w-[800px] rounded-full bg-accent/15 blur-3xl animate-float" />
        <div className="absolute -right-64 bottom-0 h-[900px] w-[900px] rounded-full bg-accent/10 blur-3xl animate-float-delayed" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-background/60 to-background/80" />
      </div>

      <div className="flex min-h-screen items-center justify-center px-6">
        <GlassCard className="w-full max-w-lg rounded-3xl border p-12 shadow-2xl backdrop-blur-xl overflow-hidden">
          {/* AnimatePresence switches between the auth form and the verification screen */}
          <AnimatePresence mode="wait">
            {pendingEmail ? (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                initial={{ opacity: 0, y: 20 }}
                key="verify"
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              >
                <VerifyScreen
                  cooldown={cooldown}
                  email={pendingEmail}
                  resendMutation={resendMutation}
                  setCooldown={setCooldown}
                  verifyMutation={verifyMutation}
                  onBack={() => setPendingEmail(null)}
                  onVerify={onVerify}
                />
              </motion.div>
            ) : (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                initial={{ opacity: 0, y: -20 }}
                key="form"
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              >
                <div className="text-center mb-10">
                  <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                    {type === 'login'
                      ? 'Войдите, чтобы продолжить управление финансами'
                      : 'Создайте аккаунт и обретите спокойствие с деньгами'}
                  </p>
                </div>

                <AuthForm
                  loginMutation={loginMutation}
                  registerMutation={registerMutation}
                  type={type}
                  onSubmit={onSubmit}
                />

                <div className="mt-10 text-center">
                  <p className="text-lg text-muted-foreground">
                    {type === 'login'
                      ? 'Ещё нет аккаунта?'
                      : 'Уже есть аккаунт?'}{' '}
                    <button
                      className="font-semibold text-accent hover:underline transition-colors"
                      type="button"
                      onClick={toggleAuthType}
                    >
                      {type === 'login'
                        ? 'Зарегистрироваться'
                        : 'Войти'}
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
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </div>
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
