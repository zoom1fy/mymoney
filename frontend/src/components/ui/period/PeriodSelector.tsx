'use client'

import styles from './PeriodSelector.module.scss'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { FC, useEffect, useState } from 'react'
import { DateRange } from 'react-day-picker'

import { Button } from '@/components/ui/calendar/button'
import { Calendar } from '@/components/ui/calendar/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover/popover'

interface PeriodSelectorProps {
  // eslint-disable-next-line no-unused-vars
  onChange: (range: { startDate?: Date; endDate?: Date }) => void
}

const periods = [
  { key: 'day', label: 'День' },
  { key: 'week', label: 'Неделя' },
  { key: 'month', label: 'Месяц' },
  { key: 'year', label: 'Год' }
] as const

type PeriodKey = (typeof periods)[number]['key']

/**
 * Функция для вычисления начальной даты для 'month'.
 * Используется только на клиенте для избежания ошибок гидрации.
 */
const getInitialMonthRange = (): DateRange => {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - 1)
  return { from: startDate, to: endDate }
}

export const PeriodSelector: FC<PeriodSelectorProps> = ({ onChange }) => {
  // Инициализируем `date` как undefined. Реальное значение установится в useEffect (только на клиенте).
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey | null>(
    'month'
  )
  const [date, setDate] = useState<DateRange | undefined>(undefined)

  // Флаг для отслеживания монтирования (для корректной гидрации)
  const isMounted = date !== undefined

  // Устанавливаем начальное состояние и вызываем onChange только после монтирования
  useEffect(() => {
    // Эта логика выполняется только на клиенте
    const initialRange = getInitialMonthRange()
    setDate(initialRange)
    onChange({
      startDate: initialRange.from,
      endDate: initialRange.to
    })
  }, [onChange])

  // Обработчик для быстрых периодов
  const handlePeriodSelect = (key: PeriodKey) => {
    setSelectedPeriod(key)

    const endDate = new Date()
    const startDate = new Date()

    switch (key) {
      case 'day':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1)
        break
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
    }

    const newRange = { from: startDate, to: endDate }
    setDate(newRange)
    onChange({ startDate: newRange.from, endDate: newRange.to })
  }

  // Обработчик для кастомного выбора в календаре
  const handleDateRangeSelect = (newRange: DateRange | undefined) => {
    setDate(newRange)
    setSelectedPeriod(null)
    onChange({ startDate: newRange?.from, endDate: newRange?.to })
  }

  // Текст для отображения в кнопке Popover
  const buttonContent =
    isMounted && date?.from ? (
      date.to ? (
        <>
          {format(date.from, 'd LLL y', { locale: ru })} -{' '}
          {format(date.to, 'd LLL y', { locale: ru })}
        </>
      ) : (
        format(date.from, 'd LLL y', { locale: ru })
      )
    ) : (
      <span>Выберите период</span>
    )

  return (
    <div className={styles.periodSelector}>
      {/* Группа кнопок для быстрых периодов */}
      <div className={styles.periodToggle}>
        <div className={styles.track} />
        <div
          className={styles.thumb}
          style={{
            transform: `translateX(${periods.findIndex(p => p.key === selectedPeriod) * 100}%)`
          }}
        />
        {periods.map((p, idx) => (
          <button
            key={p.key}
            className={`${styles.label} ${
              selectedPeriod === p.key ? styles.labelActive : ''
            }`}
            onClick={() => handlePeriodSelect(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Popover с календарем для выбора кастомного диапазона */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-[260px] justify-start text-left font-normal',
              !date && 'text-muted-foreground',
              // Подсвечиваем, если активен кастомный период
              !selectedPeriod ? styles.customActive : ''
            )}
            // Блокируем кнопку, пока не установлен начальный диапазон (SSR/монтирование)
            disabled={!isMounted}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {buttonContent}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align="center"
        >
          <Calendar
            initialFocus
            mode="range"
            // Передаем дату только если она уже установлена
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateRangeSelect}
            numberOfMonths={2}
            locale={ru}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
