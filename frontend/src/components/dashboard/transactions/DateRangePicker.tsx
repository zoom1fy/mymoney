'use client'

import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import Button from 'antd/es/button'
import ConfigProvider from 'antd/es/config-provider'
import DatePicker from 'antd/es/date-picker'
import theme from 'antd/es/theme'
import ruRU from 'antd/locale/ru_RU'
import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/ru'
import 'dayjs/locale/ru'
import { useCallback, useEffect, useState } from 'react'

dayjs.locale('ru')

const { RangePicker } = DatePicker

interface Props {
  value: {
    from: Date
    to: Date
  }
  onChange: (range: { from: Date; to: Date }) => void
}

const PRESETS = [
  { label: 'День', key: 'day', shift: 'day' },
  { label: 'Неделя', key: 'week', shift: 'week' },
  { label: 'Месяц', key: 'month', shift: 'month' },
  { label: 'Год', key: 'year', shift: 'year' }
]

export function DateRangePicker({ value, onChange }: Props) {
  const [currentPreset, setCurrentPreset] = useState<
    'day' | 'week' | 'month' | 'year'
  >('month')

  const applyPreset = useCallback(
    (preset: 'day' | 'week' | 'month' | 'year') => {
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

      setCurrentPreset(preset)
      onChange({ from: from.toDate(), to: to.toDate() })
    },
    [onChange]
  )

  const shiftRange = (dir: number) => {
    const from = dayjs(value.from)
    const to = dayjs(value.to)

    const shiftUnit = currentPreset

    const newFrom = from.add(dir, shiftUnit)
    const newTo = to.add(dir, shiftUnit)

    onChange({
      from: newFrom.toDate(),
      to: newTo.toDate()
    })
  }

  useEffect(() => {
    applyPreset('month')
  }, [])

  return (
    <ConfigProvider
      locale={ruRU}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: 'hsl(267 78% 57%)'
        }
      }}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        {/* Presets */}
        <div className="flex gap-2">
          {PRESETS.map(p => (
            <button
              key={p.key}
              className={`px-2 w-17 lg:px-4 lg:w-24 py-1 rounded-md text-sm border cursor-pointer transition ${
                currentPreset === p.key
                  ? 'bg-primary text-white border-primary'
                  : 'border-border hover:bg-muted'
              }`}
              onClick={() => applyPreset(p.key as any)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Arrows + Picker */}
        <div className="flex items-center gap-2">
          <Button
            icon={<LeftOutlined />}
            onClick={() => shiftRange(-1)}
          />

          <RangePicker
            allowClear={false}
            value={[dayjs(value.from), dayjs(value.to)]}
            onChange={dates => {
              if (!dates) return
              const [from, to] = dates
              if (!from || !to) return
              onChange({
                from: from.startOf('day').toDate(),
                to: to.endOf('day').toDate()
              })
            }}
            format="DD.MM.YYYY"
            className="w-[220px] cursor-pointer"
            placement="bottomRight"
          />

          <Button
            icon={<RightOutlined />}
            onClick={() => shiftRange(1)}
          />
        </div>
      </div>
    </ConfigProvider>
  )
}
