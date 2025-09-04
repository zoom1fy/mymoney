'use client'

import styles from './Auth.module.scss'
import { DASHBOARD_PAGES } from '@/config/pages-url.config'
import { authService } from '@/services/auth.service'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SubmitHandler, UseFormRegisterReturn, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { ThemeToggle } from '@/components/ui/theme-toogle/ThemeToggle'

import { IAuthForm } from '@/types/auth.types'

interface IFieldProps {
  id: string
  label: string
  placeholder: string
  type?: string
  register: UseFormRegisterReturn
  error?: string
}

interface IButtonProps {
  children: React.ReactNode
  type: 'submit' | 'button' | 'reset'
  isPending: boolean
}

const Field = ({
  id,
  label,
  placeholder,
  type = 'text',
  register,
  error
}: IFieldProps) => (
  <div className={styles.field}>
    <label
      htmlFor={id}
      className={styles.label}
    >
      {label}
    </label>
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      className={styles.input}
      {...register}
    />
    {error && <span className={styles.error}>{error}</span>}
  </div>
)

const Button = ({ children, type, isPending }: IButtonProps) => (
  <button
    type={type}
    disabled={isPending}
    className={styles.button}
  >
    {isPending ? 'Загрузка...' : children}
  </button>
)

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

  useEffect(() => {
    const firstInput = document.querySelector('input') as HTMLInputElement
    firstInput?.focus()
  }, [isLoginForm])

  return (
    <div className={`${styles.wrapper} flex items-center justify-center p-4`}>
      <div
        className={`${styles.formContainer} relative shadow-2xl rounded-2xl w-full max-w-md p-8 sm:p-10 overflow-hidden transition-all duration-300`}
      >
        <div className="absolute top-6 right-4">
          <ThemeToggle />
        </div>

        <h2
          className={`${styles.title} text-3xl sm:text-4xl font-extrabold mb-6 sm:mb-8 text-center tracking-tight`}
        >
          {isLoginForm ? 'Вход' : 'Регистрация'}
        </h2>

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
            register={register('email', {
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
            register={register('password', {
              required: 'Пароль обязателен',
              minLength: {
                value: 6,
                message: 'Пароль должен содержать минимум 6 символов'
              }
            })}
            error={errors.password?.message}
          />

          <Button
            type="submit"
            isPending={isPending}
          >
            {isLoginForm ? 'Войти' : 'Регистрация'}
          </Button>
        </form>

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
