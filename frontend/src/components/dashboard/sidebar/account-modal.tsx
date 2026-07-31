'use client'

import {
  Banknote,
  Coins,
  Folder,
  LayoutGrid,
  Palette,
  Pencil,
  Plus,
  Wallet
} from 'lucide-react'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { NumericFormat } from 'react-number-format'

import { AccentButton } from '@/components/ui/buttons/accent-button'
import { GlassCard } from '@/components/ui/cards/glass-card'
import { IconPicker } from '@/components/ui/icon-picker/icon-picker'
import { ModalHeader } from '@/components/ui/modal/modal-header'
import { Button } from '@/components/ui/shadui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger
} from '@/components/ui/shadui/dialog'
import { Input } from '@/components/ui/shadui/input'
import { Label } from '@/components/ui/shadui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/shadui/select'

import {
  AccountCategoryEnum,
  AccountTypeEnum,
  IAccount,
  ICreateAccount,
  accountIcons
} from '@/types/account.type'

import { useAccounts } from '@/hooks/use-accounts'
import { useCurrencies } from '@/hooks/use-currencies'

import { cn } from '@/lib/cn'

import { ConfirmAlert } from '../../ui/dialogs/confirm-alert'

interface Props {
  mode?: 'create' | 'edit'
  account?: IAccount
  trigger?: ReactNode
}

const fieldClasses =
  '!h-14 w-full text-lg px-6 rounded-xl bg-background border-2'
const containerClasses = 'w-full min-w-0 space-y-2'

export function AccountModal({ mode = 'create', account, trigger }: Props) {
  const isEdit = mode === 'edit'

  const {
    createAccount,
    updateAccount,
    deleteAccount,
    isCreating,
    isUpdating,
    isDeleting
  } = useAccounts()

  const { currencies } = useCurrencies()

  const [isOpen, setIsOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false)

  const handleDelete = async () => {
    if (!account) return

    try {
      await deleteAccount(account.id)
      setIsConfirmOpen(false)
      setIsOpen(false)
    } catch {
      // Toast shown by useAccounts hook.
    }
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty }
  } = useForm<ICreateAccount>({
    defaultValues: {
      name: '',
      currentBalance: 0,
      categoryId: AccountCategoryEnum.ACCOUNTS,
      typeId: AccountTypeEnum.CARD,
      currencyCode: 'RUB'
    }
  })

  // Reset form when dialog opens (edit → prefill, create → defaults)
  useEffect(() => {
    if (!isOpen) return

    if (isEdit && account) {
      reset({
        name: account.name,
        currentBalance: account.currentBalance,
        categoryId: account.categoryId,
        typeId: account.typeId,
        currencyCode: account.currencyCode,
        icon: account.icon
      })
    } else {
      reset()
    }
  }, [isOpen, isEdit, account, reset])

  const onSubmit = async (data: ICreateAccount) => {
    try {
      if (isEdit && account) {
        await updateAccount({ id: account.id, data })
      } else {
        await createAccount(data)
      }

      setIsOpen(false)
      reset()
    } catch {
      // Toast shown by useAccounts hook.
    }
  }

  // Guard close with unsaved-changes confirmation
  const attemptClose = () => {
    if (isDirty) {
      setIsCloseConfirmOpen(true)
      return
    }
    setIsOpen(false)
  }

  const confirmClose = () => {
    setIsCloseConfirmOpen(false)
    setIsOpen(false)
  }

  const selectedIcon = watch('icon')
  const selectedName = watch('name')
  const isLoading = isCreating || isUpdating || isDeleting

  // Block submit until a name and an icon are chosen
  const canSubmit = !!selectedIcon && selectedName.trim().length > 0

  const formRef = useRef<HTMLDivElement>(null)
  const [formHeight, setFormHeight] = useState<number | undefined>(undefined)

  // Remeasure when the dialog opens because the form is only mounted then
  useEffect(() => {
    if (!isOpen) return

    const el = formRef.current
    if (!el) return

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setFormHeight(entry.contentRect.height)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [isOpen])

  return (
    <Dialog
      open={isOpen}
      onOpenChange={newOpen => {
        if (!newOpen) {
          attemptClose()
          return
        }
        setIsOpen(true)
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            className="w-full justify-center cursor-pointer hover:[&_svg]:rotate-90 [&_svg]:transition-transform [&_svg]:duration-500"
            variant="outline"
          >
            <Plus className="size-5" />
            <span className="text-base">Добавить счёт</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent
        className="w-[95vw] max-w-5xl xl:max-w-6xl p-0 max-h-[90vh] overflow-y-auto"
        showCloseButton={false}
      >
        <GlassCard className="rounded-2xl p-8 md:p-10 shadow-xl transition-all duration-700">
          <DialogHeader className="mb-4">
            <ModalHeader
              icon={
                isEdit ? (
                  <Pencil className="size-6 text-white" />
                ) : (
                  <Plus className="size-6 text-white" />
                )
              }
              isDeleteLoading={isDeleting}
              isDeleteVisible={isEdit && !!account}
              title={isEdit ? 'Редактирование счёта' : 'Создание нового счёта'}
              onClose={attemptClose}
              onDelete={() => setIsConfirmOpen(true)}
            />
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="grid gap-8 md:grid-cols-2">
              <div className="self-start space-y-4" ref={formRef}>
                <div className={containerClasses}>
                  <Label className="text-base font-medium ml-1 flex items-center gap-2">
                    <Wallet className="size-4 opacity-70" /> Название
                  </Label>
                  <Input
                    className={cn(fieldClasses)}
                    placeholder="Зарплатная карта"
                    {...register('name', { required: 'Обязательное поле' })}
                  />
                  {errors.name && (
                    <p className="text-destructive text-sm">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={containerClasses}>
                    <Label className="text-base font-medium ml-1 flex items-center gap-2">
                      <Banknote className="size-4 opacity-70" /> Баланс
                    </Label>
                    <NumericFormat
                      allowNegative={false}
                      className={cn(
                        fieldClasses,
                        'text-2xl font-bold border-2 focus-visible:ring-offset-0',
                        errors.currentBalance && 'border-destructive'
                      )}
                      customInput={Input}
                      decimalScale={2}
                      decimalSeparator=","
                      isAllowed={values => {
                        const { value } = values
                        const digits = value.replace(/\D/g, '')
                        return digits.length <= 10
                      }}
                      placeholder="0,00"
                      thousandSeparator=" "
                      value={watch('currentBalance')}
                      onValueChange={values => {
                        setValue('currentBalance', values.floatValue || 0)
                      }}
                    />
                    {errors.currentBalance && (
                      <p className="text-destructive text-sm">
                        {errors.currentBalance.message}
                      </p>
                    )}
                  </div>

                  <div className={containerClasses}>
                    <Label className="text-base font-medium ml-1 flex items-center gap-2">
                      <Coins className="size-4 opacity-70" /> Валюта
                    </Label>
                    <Select
                      disabled={isEdit}
                      value={watch('currencyCode')}
                      onValueChange={v => setValue('currencyCode', v)}
                    >
                      <SelectTrigger
                        className={cn(
                          fieldClasses,
                          'flex items-center justify-between cursor-pointer',
                          errors.currencyCode && 'border-destructive'
                        )}
                      >
                        <SelectValue placeholder="Валюта" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl bg-background max-h-60">
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-1 pt-2">
                          Фиат
                        </div>
                        {currencies
                          .filter(c => c.type === 'FIAT')
                          .map(c => (
                            <SelectItem
                              key={c.code}
                              value={c.code}
                            >
                              {c.symbol} {c.name}
                            </SelectItem>
                          ))}
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t border-border mt-1 pt-2">
                          Криптовалюты
                        </div>
                        {currencies
                          .filter(c => c.type === 'CRYPTO')
                          .map(c => (
                            <SelectItem
                              key={c.code}
                              value={c.code}
                            >
                              {c.symbol} {c.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={containerClasses}>
                    <Label className="text-base font-medium ml-1 flex items-center gap-2">
                      <Folder className="size-4 opacity-70" /> Категория
                    </Label>
                    <Select
                      value={watch('categoryId')?.toString()}
                      onValueChange={v =>
                        setValue('categoryId', Number(v) as AccountCategoryEnum)
                      }
                    >
                      <SelectTrigger
                        className={cn(
                          fieldClasses,
                          'flex items-center justify-between cursor-pointer',
                          errors.categoryId && 'border-destructive'
                        )}
                      >
                        <SelectValue placeholder="Категория" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl bg-background">
                        <SelectItem value="1">Счёт</SelectItem>
                        <SelectItem value="2">Сберегательный</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className={containerClasses}>
                    <Label className="text-base font-medium ml-1 flex items-center gap-2">
                      <LayoutGrid className="size-4 opacity-70" /> Тип
                    </Label>
                    <Select
                      value={watch('typeId')?.toString()}
                      onValueChange={v =>
                        setValue('typeId', Number(v) as AccountTypeEnum)
                      }
                    >
                      <SelectTrigger
                        className={cn(
                          fieldClasses,
                          'flex items-center justify-between cursor-pointer',
                          errors.typeId && 'border-destructive'
                        )}
                      >
                        <SelectValue placeholder="Тип" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl bg-background">
                        <SelectItem value="1">Наличные</SelectItem>
                        <SelectItem value="2">Карта</SelectItem>
                        <SelectItem value="3">Крипто</SelectItem>
                        <SelectItem value="4">Накопительный</SelectItem>
                        <SelectItem value="5">Депозит</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div
                className="flex flex-col"
                style={formHeight ? { height: formHeight } : undefined}
              >
                <Label className="text-base font-medium ml-1 mb-2 flex items-center gap-2">
                  <Palette className="size-4 opacity-70" /> Иконка
                </Label>
                <IconPicker
                  gridClassName="lg:grid-cols-5"
                  icons={accountIcons}
                  scrollAreaClassName="flex-1 min-h-0 max-h-[17rem]"
                  value={selectedIcon}
                  onChange={icon => setValue('icon', icon)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
              <AccentButton
                className="h-14 sm:flex-1"
                disabled={!canSubmit || isLoading}
                size="lg"
                type="submit"
                variant="outline"
              >
                {isEdit ? 'Сохранить' : 'Создать'}
              </AccentButton>

              <AccentButton
                className="h-14 sm:flex-1"
                disabled={isLoading}
                size="lg"
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Отмена
              </AccentButton>
            </div>

            <ConfirmAlert
              cancelText="Отмена"
              confirmText="Удалить"
              description={
                <>
                  Счёт <b>«{account?.name}»</b> будет удалён навсегда.
                  <br />
                  Это действие нельзя отменить.
                </>
              }
              isLoading={isDeleting}
              isOpen={isConfirmOpen}
              title="Удалить счёт?"
              onConfirm={handleDelete}
              onOpenChange={setIsConfirmOpen}
            />

            <ConfirmAlert
              cancelText="Остаться"
              confirmText="Закрыть"
              description="У вас есть несохранённые изменения. Вы уверены, что хотите закрыть?"
              isDestructive={false}
              isOpen={isCloseConfirmOpen}
              title="Несохранённые изменения"
              onConfirm={confirmClose}
              onOpenChange={setIsCloseConfirmOpen}
            />
          </form>
        </GlassCard>
      </DialogContent>
    </Dialog>
  )
}
