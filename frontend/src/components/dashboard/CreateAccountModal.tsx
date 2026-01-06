// src/components/accounts/CreateAccountModal.tsx
'use client'

import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { AccentButton } from '@/components/ui/buttons/accent-button'
import { GlassCard } from '@/components/ui/cards/glass-card'
import { Button } from '@/components/ui/shadui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/shadui/dialog'
import { Input } from '@/components/ui/shadui/input'
import { Label } from '@/components/ui/shadui/label'
import { ScrollArea } from '@/components/ui/shadui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/shadui/select'

import {
  AccountCategoryEnum,
  AccountIconName,
  AccountIcons,
  AccountTypeEnum,
  CurrencyCode,
  ICreateAccount
} from '@/types/account.types'

import { useAccounts } from '@/hooks/useAccounts'

// src/components/accounts/CreateAccountModal.tsx

// src/components/accounts/CreateAccountModal.tsx

// src/components/accounts/CreateAccountModal.tsx

// src/components/accounts/CreateAccountModal.tsx

// src/components/accounts/CreateAccountModal.tsx

// src/components/accounts/CreateAccountModal.tsx

// src/components/accounts/CreateAccountModal.tsx

// src/components/accounts/CreateAccountModal.tsx

// src/components/accounts/CreateAccountModal.tsx

// src/components/accounts/CreateAccountModal.tsx

// src/components/accounts/CreateAccountModal.tsx

// src/components/accounts/CreateAccountModal.tsx

// src/components/accounts/CreateAccountModal.tsx

const iconOptions = Object.keys(AccountIcons) as AccountIconName[]

export function CreateAccountModal() {
  const { createAccount, isCreating } = useAccounts()
  const [open, setOpen] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<ICreateAccount>({
    defaultValues: {
      currentBalance: 0,
      categoryId: AccountCategoryEnum.ACCOUNTS,
      typeId: AccountTypeEnum.CARD,
      currencyCode: CurrencyCode.RUB
    }
  })

  const onSubmit = async (data: ICreateAccount) => {
    try {
      await createAccount(data) // ждём ответ
      setOpen(false) // ✅ закрываем только при success
      reset()
    } catch {
      // ничего не делаем
      // toast уже показан в useAccounts
      // модалка остаётся открытой
    }
  }

  const selectedIcon = watch('icon')
  const SelectedIcon = selectedIcon ? AccountIcons[selectedIcon] : null

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-center cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          <span className="text-base">Добавить счёт</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[95vw] max-w-5xl xl:max-w-6xl p-0 border-0 bg-transparent max-h-[90vh] overflow-y-auto">
        <GlassCard className="rounded-3xl p-10 md:p-14 shadow-2xl text-xl">
          <DialogHeader className="text-center mb-10">
            <DialogTitle className="text-4xl md:text-5xl font-bold tracking-tight">
              Новый счёт
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-10"
          >
            {/* Название и баланс */}
            <div className="grid gap-8 lg:gap-12 md:grid-cols-2">
              <div className="space-y-4">
                <Label
                  htmlFor="name"
                  className="text-lg font-medium"
                >
                  Название счёта
                </Label>
                <Input
                  id="name"
                  placeholder="Тинькофф Black"
                  className="h-14 text-lg px-6 bg-background border"
                  {...register('name', { required: 'Обязательное поле' })}
                />
                {errors.name && (
                  <p className="text-destructive text-sm">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <Label
                  htmlFor="balance"
                  className="text-lg font-medium"
                >
                  Начальный баланс
                </Label>
                <Input
                  id="balance"
                  type="number"
                  step="1"
                  placeholder="0.00"
                  className="h-14 text-lg px-6 bg-background border"
                  onKeyDown={e => {
                    if (e.key === '-') e.preventDefault()
                  }}
                  {...register('currentBalance', {
                    valueAsNumber: true,
                    min: {
                      value: 0,
                      message: 'Баланс не может быть отрицательным'
                    }
                  })}
                />
              </div>
            </div>

            {/* Категория, тип, валюта */}
            <div className="grid gap-8 md:grid-cols-3">
              <div className="space-y-4">
                <Label className="text-lg font-medium">Категория</Label>
                <Select
                  value={watch('categoryId')?.toString()}
                  onValueChange={v =>
                    setValue('categoryId', Number(v) as AccountCategoryEnum)
                  }
                >
                  <SelectTrigger className="text-xl p-6 w-2xs bg-background border rounded-xl">
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent className="bg-background backdrop-blur-none border shadow-xl rounded-xl text-xl">
                    <SelectItem value={AccountCategoryEnum.ACCOUNTS.toString()}>
                      Счёт
                    </SelectItem>
                    <SelectItem value={AccountCategoryEnum.SAVINGS.toString()}>
                      Сберегательный
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label className="text-lg font-medium">Тип</Label>
                <Select
                  value={watch('typeId')?.toString()}
                  onValueChange={v =>
                    setValue('typeId', Number(v) as AccountTypeEnum)
                  }
                >
                  <SelectTrigger className="text-xl p-6 w-2xs px-6 bg-background border">
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent className="bg-background backdrop-blur-none border shadow-xl">
                    <SelectItem value={AccountTypeEnum.CASH.toString()}>
                      Наличные
                    </SelectItem>
                    <SelectItem value={AccountTypeEnum.CARD.toString()}>
                      Карта
                    </SelectItem>
                    <SelectItem value={AccountTypeEnum.CRYPTO.toString()}>
                      Крипто
                    </SelectItem>
                    <SelectItem value={AccountTypeEnum.SAVING.toString()}>
                      Накопительный
                    </SelectItem>
                    <SelectItem value={AccountTypeEnum.DEPOSIT.toString()}>
                      Депозит
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label className="text-lg font-medium">Валюта</Label>
                <Select
                  value={watch('currencyCode')}
                  onValueChange={v =>
                    setValue('currencyCode', v as CurrencyCode)
                  }
                >
                  <SelectTrigger className="text-xl p-6 w-2xs bg-background border">
                    <SelectValue placeholder="Выберите валюту" />
                  </SelectTrigger>
                  <SelectContent className="bg-background backdrop-blur-none border shadow-xl">
                    <SelectItem value={CurrencyCode.RUB}>₽ Рубль</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Иконки — по 5 в строке + скролл */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">Иконка</Label>
              <ScrollArea className="h-64 rounded-xl border bg-background/50">
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4 p-4">
                  {iconOptions.map(iconName => {
                    const Icon = AccountIcons[iconName]
                    const isSelected = selectedIcon === iconName

                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() =>
                          setValue('icon', isSelected ? undefined : iconName)
                        }
                        className={cn(
                          'flex h-16 w-16 items-center justify-center rounded-xl border-2 transition-all',
                          isSelected
                            ? 'border-accent bg-accent/20 shadow-xl scale-110'
                            : 'border-transparent hover:border-accent/50 hover:bg-accent/10 hover:scale-105'
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-8 w-8',
                            isSelected ? 'text-accent' : 'text-foreground'
                          )}
                        />
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Кнопки */}
            <div className="flex flex-col sm:flex-row gap-6">
              <AccentButton
                type="submit"
                size="lg"
                className="flex-2 h-14 text-lg font-medium"
                disabled={isCreating}
              >
                {isCreating ? 'Создаём...' : 'Создать счёт'}
              </AccentButton>

              <AccentButton
                type="button"
                variant="ghost"
                size="lg"
                className="flex-1 h-14 text-lg"
                onClick={() => setOpen(false)}
                disabled={isCreating}
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
