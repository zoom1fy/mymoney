'use client'

import styles from './Auth.module.scss'
import { DASHBOARD_PAGES } from '@/config/pages-url.config'
import { authService } from '@/services/auth.service'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/buttons/Button'
import { Field } from '@/components/ui/fields/Fields'
import { ThemeToggle } from '@/components/ui/theme-toogle/ThemeToggle'

import { IAuthForm } from '@/types/auth.types'

export function Auth() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<IAuthForm>({
    mode: 'onChange'
  })
  const [isLoginForm, setIsLoginForm] = useState(true)
  const { push } = useRouter()

  const { mutate, isPending } = useMutation({
    mutationKey: ['auth'],
    mutationFn: (data: IAuthForm) =>
      authService.main(isLoginForm ? 'login' : 'register', data),
    onSuccess: () => {
      toast.success(isLoginForm ? 'Успешный вход!' : 'Регистрация успешна!', {
        duration: 2000,
        className: styles.toastSuccess
      })
      reset()
      push(DASHBOARD_PAGES.HOME)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Произошла ошибка', {
        duration: 3000,
        className: styles.toastError
      })
    }
  })

  const onSubmit: SubmitHandler<IAuthForm> = data => {
    mutate(data)
  }

  // Focus management for accessibility
  useEffect(() => {
    const firstInput = document.querySelector('input') as HTMLInputElement
    firstInput?.focus()
  }, [isLoginForm])

  return (
    <div
      className={`${styles.pageBackground} min-h-screen flex items-center justify-center p-4`}
    >
      <div
        className={`${styles.formContainer} relative shadow-2xl rounded-2xl w-full max-w-md p-8 sm:p-10 overflow-hidden transition-all duration-300`}
      >
        {/* ThemeToggle */}
        <div className="absolute top-6 right-4">
          <ThemeToggle />
        </div>

        {/* Blob animations */}
        <div
          className={`${styles.blob} ${styles.blobIndigo} ${styles.pointerNone}`}
        ></div>
        <div
          className={`${styles.blob} ${styles.blobPink} ${styles.animationDelay2s} ${styles.pointerNone}`}
        ></div>
        <div
          className={`${styles.blob} ${styles.blobPurple} ${styles.animationDelay4s} ${styles.pointerNone}`}
        ></div>

        {/* Form header */}
        <h2 className="text-3xl sm:text-4xl font-extrabold mb-6 sm:mb-8 text-center tracking-tight">
          {isLoginForm ? 'Вход' : 'Регистрация'}
        </h2>

        {/* Form */}
        <form
          className="space-y-6"
          onSubmit={handleSubmit(onSubmit)}
          aria-label={isLoginForm ? 'Форма входа' : 'Форма регистрации'}
          noValidate
        >
          <Field
            id="email"
            label="Email"
            placeholder="your@email.com"
            {...register('email', {
              required: 'Email обязателен',
              pattern: {
                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                message: 'Неверный формат email'
              }
            })}
            error={errors.email?.message}
          />

          <Field
            id="password"
            label="Пароль"
            placeholder="••••••••"
            type="password"
            {...register('password', {
              required: 'Пароль обязателен',
              minLength: {
                value: 6,
                message: 'Пароль должен содержать минимум 6 символов'
              }
            })}
            error={errors.password?.message}
          />

          {/* Submit button */}
          <Button
            type="submit"
            isPending={isPending}
            aria-label={isLoginForm ? 'Войти' : 'Регистрация'}
          >
            {isLoginForm ? 'Войти' : 'Регистрация'}
          </Button>
        </form>

        {/* Toggle between login and register */}
        <p className="mt-6 text-sm text-center">
          {isLoginForm ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
          <button
            type="button"
            onClick={() => setIsLoginForm(!isLoginForm)}
            className={`${styles.toggleButton} font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] rounded`}
            aria-label={
              isLoginForm ? 'Перейти к регистрации' : 'Перейти ко входу'
            }
          >
            {isLoginForm ? 'Регистрация' : 'Вход'}
          </button>
        </p>
      </div>
    </div>
  )
}
