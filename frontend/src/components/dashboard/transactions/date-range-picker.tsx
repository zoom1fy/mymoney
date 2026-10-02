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
    <div className="flex flex-col gap-2 items-center">
      {/* Presets */}
      <div className="grid grid-cols-4 gap-2 w-full sm:w-auto">
        {presets.map(p => {
          const isActive = currentPreset === p.key

          return (
            <Button
              className={cn(
                'h-9 px-4 rounded-lg text-sm font-medium',
                'border transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-md'
                  : 'bg-muted/40 border-border hover:bg-accent/10 hover:border-accent/40'
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
      <div className="flex items-center gap-2">
        <Button
          aria-label="Предыдущий период"
          size="icon"
          variant="outline"
          onClick={() => shiftRange(-1)}
        >
          <ChevronLeft className="size-4" />
        </Button>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              className="w-[240px] cursor-pointer justify-between font-normal tabular-nums"
              variant="outline"
            >
              <span>{format(value.from, displayFormat, { locale: ru })}</span>
              <span className="text-muted-foreground">—</span>
              <span>{format(value.to, displayFormat, { locale: ru })}</span>
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="end"
            className="w-auto p-0 border border-border bg-card shadow-2xl rounded-2xl overflow-x-auto"
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
