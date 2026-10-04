'use client'

import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/ru'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { DayPickerLocale } from 'react-day-picker/locale'

import { Button } from '@/components/ui/shadui/button'
import { Calendar } from '@/components/ui/shadui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/shadui/popover'

import { cn } from '@/lib/cn'

dayjs.locale('ru')

interface Props {
  value: {
    from: Date
    to: Date
  }
  onChange: (range: { from: Date; to: Date }) => void
}

const presets = [
  { label: 'День', key: 'day', shift: 'day' },
  { label: 'Неделя', key: 'week', shift: 'week' },
  { label: 'Месяц', key: 'month', shift: 'month' },
  { label: 'Год', key: 'year', shift: 'year' }
] as const

type PresetKey = (typeof presets)[number]['key']

const displayFormat = 'dd.MM.yyyy'

function getPresetFromRange(from: Dayjs, to: Dayjs): PresetKey | null {
  if (from.isSame(from.startOf('day')) && to.isSame(from.endOf('day')))
    return 'day'

  if (from.isSame(from.startOf('week')) && to.isSame(from.endOf('week')))
    return 'week'

  if (from.isSame(from.startOf('month')) && to.isSame(from.endOf('month')))
    return 'month'

  if (from.isSame(from.startOf('year')) && to.isSame(from.endOf('year')))
    return 'year'

  return null
}

// Preset-based date picker with dayjs; detects which preset matches the current range for highlight
export function DateRangePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)

  const fromD = dayjs(value.from)
  const toD = dayjs(value.to)

  const currentPreset = getPresetFromRange(fromD, toD)

  const applyPreset = (preset: PresetKey) => {
    const now = dayjs()
    let from: Dayjs
    let to: Dayjs

    switch (preset) {
      case 'day':
        from = now.startOf('day')
        to = now.endOf('day')
        break
      case 'week':
        from = now.startOf('week')
        to = now.endOf('week')
        break
      case 'month':
        from = now.startOf('month')
        to = now.endOf('month')
        break
      case 'year':
        from = now.startOf('year')
        to = now.endOf('year')
        break
    }

    onChange({ from: from.toDate(), to: to.toDate() })
  }

  // Move the range forward/backward by one preset unit
  const shiftRange = (dir: number) => {
    const preset = currentPreset ?? 'month'
    const newBase = fromD.add(dir, preset)
    const newFrom = newBase.startOf(preset)
    const newTo = newBase.endOf(preset)
    onChange({
      from: newFrom.toDate(),
      to: newTo.toDate()
    })
  }

  return (
    <div className="flex w-full flex-col items-center gap-2">
      {/* Presets */}
      <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:grid-cols-4">
        {presets.map(p => {
          const isActive = currentPreset === p.key

          return (
            <Button
              className={cn(
                'h-9 px-4 rounded-lg text-sm font-medium',
                'border transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-md'
                  : 'bg-muted/40 text-foreground border-border hover:bg-accent/10 hover:text-accent-foreground hover:border-accent/40'
              )}
              key={p.key}
              onClick={() => applyPreset(p.key)}
            >
              {p.label}
            </Button>
          )
        })}
      </div>

      {/* Arrows + Picker */}
      <div className="flex w-full items-center justify-center gap-1 sm:gap-2">
        <Button
          aria-label="Предыдущий период"
          className="shrink-0"
          size="icon"
          variant="outline"
          onClick={() => shiftRange(-1)}
        >
          <ChevronLeft className="size-4" />
        </Button>

        <Popover
          open={open}
          onOpenChange={setOpen}
        >
          <PopoverTrigger asChild>
            <Button
              className="min-w-0 flex-1 cursor-pointer justify-between font-normal tabular-nums sm:w-[240px] sm:flex-none"
              variant="outline"
            >
              <span>{format(value.from, displayFormat, { locale: ru })}</span>
              <span className="text-muted-foreground">—</span>
              <span>{format(value.to, displayFormat, { locale: ru })}</span>
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="end"
            className="w-auto rounded-2xl border border-border bg-card p-0 shadow-2xl"
          >
            <Calendar
              className="p-3"
              locale={ru as unknown as DayPickerLocale}
              mode="range"
              numberOfMonths={2}
              selected={{ from: value.from, to: value.to }}
              onSelect={range => {
                if (!range?.from || !range?.to) return
                onChange({
                  from: dayjs(range.from).startOf('day').toDate(),
                  to: dayjs(range.to).endOf('day').toDate()
                })
                setOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>

        <Button
          aria-label="Следующий период"
          className="shrink-0"
          size="icon"
          variant="outline"
          onClick={() => shiftRange(1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
