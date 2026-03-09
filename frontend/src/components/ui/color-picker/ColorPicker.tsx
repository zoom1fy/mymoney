'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/shadui/popover'
import { Input } from '@/components/ui/shadui/input'
import { Label } from '@/components/ui/shadui/label'
import { HexColorPicker } from 'react-colorful'

interface Props {
  value: string
  onChange: (value: string) => void
  label?: string
}

function throttle<T extends (...args: any[]) => void>(func: T, delay: number): T {
  let timeout: NodeJS.Timeout | null = null
  return function (this: any, ...args: Parameters<T>) {
    if (!timeout) {
      func.apply(this, args)
      timeout = setTimeout(() => {
        timeout = null
      }, delay)
    }
  } as T
}

function toHex(color: string): string {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return '#ffffff'
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export function ColorPicker({ value, onChange, label = 'Цвет' }: Props) {
  const [open, setOpen] = useState(false)
  const [internalValue, setInternalValue] = useState(value)

  useEffect(() => {
    setInternalValue(value)
  }, [value])

  const hexValue = useMemo(() => toHex(internalValue), [internalValue])

  const presetColors = [
    '#6366F1', '#22C55E', '#F59E0B', '#EF4444',
    '#06B6D4', '#A855F7', '#F97316', '#14B8A6',
    '#DB2777', '#3B82F6', '#84CC16', '#E11D48'
  ]

  const throttledOnChange = useCallback(throttle(onChange, 50), [onChange])

  return (
    <div className="space-y-3">
      <Label className="text-lg">{label}</Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'w-full h-14 rounded-xl border bg-background/50 backdrop-blur-sm',
              'flex items-center justify-between px-4 cursor-pointer transition-all',
              'hover:bg-accent/10 hover:border-accent/50'
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className="size-6 rounded-md border shadow-sm"
                style={{ backgroundColor: internalValue }}
              />
              <span className="text-sm text-muted-foreground">{internalValue}</span>
            </div>
          </button>
        </PopoverTrigger>

        <PopoverContent
          side="bottom"
          align="start"
          className="w-[280px] bg-background/70 backdrop-blur-xl border rounded-2xl p-4 shadow-xl"
        >
          <div className="space-y-4">
            {/* HEX input */}
            <Input
              type="text"
              value={internalValue}
              onChange={e => {
                setInternalValue(e.target.value)
                onChange(e.target.value)
              }}
              placeholder="#FF5733"
              className="h-10"
            />

            {/* Preset colors */}
            <div className="grid grid-cols-6 gap-2">
              {presetColors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setInternalValue(c)
                    onChange(c)
                  }}
                  className={cn(
                    'size-8 rounded-md border transition-all',
                    'hover:scale-110 hover:shadow-lg'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Пикер — ширина под шаблоны */}
            <div className="w-full max-w-[200px] mx-auto">
              <HexColorPicker
                color={hexValue}
                onChange={throttledOnChange}
                className="w-full rounded-md shadow-md"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}