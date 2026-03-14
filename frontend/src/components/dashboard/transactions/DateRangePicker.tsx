'use client'

import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import Button from 'antd/es/button'
import ConfigProvider from 'antd/es/config-provider'
import DatePicker from 'antd/es/date-picker'
import theme from 'antd/es/theme'
import ruRU from 'antd/locale/ru_RU'
import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/ru'

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
] as const

type PresetKey = (typeof PRESETS)[number]['key']

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

export function DateRangePicker({ value, onChange }: Props) {
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
    <ConfigProvider
      locale={ruRU}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: 'hsl(267 78% 57%)'
        }
      }}
    >
      <div className="flex flex-col gap-2 items-center">
        {/* Presets */}
        <div className="grid grid-cols-4 gap-2 w-full sm:w-auto">
          {' '}
          {PRESETS.map(p => {
            const isActive = currentPreset === p.key

            return (
              <Button
                key={p.key}
                onClick={() => applyPreset(p.key)}
                type={isActive ? 'primary' : 'default'}
                className={`
          h-9 px-4 rounded-lg text-sm font-medium
          border transition-all
          ${
            isActive
              ? 'bg-primary text-primary-foreground border-primary shadow-md'
              : 'bg-muted/40 border-border hover:bg-accent/10 hover:border-accent/40'
          }
        `}
              >
                {p.label}
              </Button>
            )
          })}
        </div>

        {/* Arrows + Picker */}
        <div className="flex items-center gap-2">
          <Button
            icon={<LeftOutlined />}
            onClick={() => shiftRange(-1)}
          />

          <RangePicker
            allowClear={false}
            value={[fromD, toD]}
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
