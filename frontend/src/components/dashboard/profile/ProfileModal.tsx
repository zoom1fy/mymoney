'use client'

import { Loader2, User } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { AccentButton } from '@/components/ui/buttons/accent-button'
import { GlassCard } from '@/components/ui/cards/glass-card'
import { ModalHeader } from '@/components/ui/modal/modal-header'
import {
  Dialog,
  DialogContent,
  DialogHeader
} from '@/components/ui/shadui/dialog'
import { Input } from '@/components/ui/shadui/input'
import { Label } from '@/components/ui/shadui/label'

import { useProfile } from '@/hooks/useProfile'

import { cn } from '@/lib/utils'

interface IProfileForm {
  email: string
  password: string
  confirmPassword: string
  currentPassword: string
}

const FIELD_CLASSES =
  'h-14 w-full text-lg px-5 rounded-xl bg-background border-2'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileModal({ open, onOpenChange }: Props) {
  const { profile, updateProfile, isUpdatingProfile } = useProfile()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<IProfileForm>({
    mode: 'onChange'
  })

  useEffect(() => {
    if (open && profile) {
      reset({
        email: profile.email || '',
        password: '',
        confirmPassword: '',
        currentPassword: ''
      })
    }
  }, [open, profile, reset])

  const passwordValue = watch('password')

  const onSubmit = async (data: IProfileForm) => {
    const payload: {
      email?: string
      password?: string
      currentPassword: string
    } = {
      currentPassword: data.currentPassword
    }

    if (data.email !== profile?.email) {
      payload.email = data.email
    }

    if (data.password) {
      payload.password = data.password
    }

    try {
      await updateProfile(payload)
      onOpenChange(false)
      reset()
    } catch {}
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        showCloseButton={false}
        className="w-[95vw] max-w-3xl p-0"
      >
        <GlassCard className="rounded-3xl p-10">
          <DialogHeader className="mb-8">
            <ModalHeader
              icon={<User className="size-6 text-white" />}
              title="Профиль"
              onClose={() => onOpenChange(false)}
            />
          </DialogHeader>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-8"
          >
            <div className="space-y-3">
              <Label className="text-lg font-medium">Email</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                className={cn(FIELD_CLASSES)}
                {...register('email', {
                  required: 'Email обязателен',
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: 'Введите корректный email'
                  }
                })}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-lg font-medium">Новый пароль</Label>
              <Input
                type="password"
                placeholder="••••••••"
                className={cn(FIELD_CLASSES)}
                {...register('password', {
                  minLength: {
                    value: 6,
                    message: 'Минимум 6 символов'
                  }
                })}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-lg font-medium">
                Повторите новый пароль
              </Label>
              <Input
                type="password"
                placeholder="••••••••"
                className={cn(FIELD_CLASSES)}
                {...register('confirmPassword', {
                  validate: value =>
                    !passwordValue ||
                    value === passwordValue ||
                    'Пароли не совпадают'
                })}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="border-t border-border/50 pt-6">
              <div className="space-y-3">
                <Label className="text-lg font-medium">
                  Текущий пароль
                  <span className="text-muted-foreground text-base font-normal ml-2">
                    (обязательно для сохранения)
                  </span>
                </Label>
                <Input
                  type="password"
                  placeholder="Введите текущий пароль"
                  className={cn(
                    FIELD_CLASSES,
                    errors.currentPassword &&
                      'border-destructive focus-visible:border-destructive'
                  )}
                  {...register('currentPassword', {
                    required: 'Текущий пароль обязателен'
                  })}
                />
                {errors.currentPassword && (
                  <p className="text-sm text-destructive">
                    {errors.currentPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-6 pt-4">
              <AccentButton
                type="submit"
                size="lg"
                className="h-14 sm:flex-1"
                disabled={isUpdatingProfile}
              >
                {isUpdatingProfile ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  'Сохранить'
                )}
              </AccentButton>

              <AccentButton
                type="button"
                variant="ghost"
                size="lg"
                className="h-14 sm:flex-1"
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </AccentButton>
            </div>
          </form>
        </GlassCard>
      </DialogContent>
    </Dialog>
  )
}
