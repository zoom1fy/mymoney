'use client'

import { Shuffle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { HexColorPicker } from 'react-colorful'

import { Button } from '@/components/ui/shadui/button'
import { Input } from '@/components/ui/shadui/input'
import { Label } from '@/components/ui/shadui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/shadui/popover'

import { getRandomColor, isValidHex, throttle } from '@/lib/color-utils'
import { cn } from '@/lib/utils'

interface Props {
  value: string
  onChange: (value: string) => void
  label?: string
}

const PRESET_COLORS = [
  '#6366F1',
  '#22C55E',
  '#F59E0B',
  '#EF4444',
  '#06B6D4',
  '#A855F7',
  '#F97316',
  '#14B8A6',
  '#DB2777',
  '#3B82F6',
  '#84CC16',
  '#E11D48'
]

export function ColorPicker({ value, onChange, label = 'Цвет' }: Props) {
  const [open, setOpen] = useState(false)
  const [localColor, setLocalColor] = useState(value)

  // Синхронизация при внешнем изменении (например, кнопка Shuffle в модалке)
  useEffect(() => {
    setLocalColor(value)
  }, [value])

  const throttledOnChange = useCallback(
    throttle((val: string) => onChange(val), 100),
    [onChange]
  )

  const handleRandomize = () => {
    const newColor = getRandomColor()
    setLocalColor(newColor)
    onChange(newColor)
  }

  const safeColor = isValidHex(localColor) ? localColor : '#6366F1'

  return (
    <div className="space-y-3">
      <Label className="text-lg">{label}</Label>

      <Popover
        open={open}
        onOpenChange={setOpen}
      >
        <PopoverTrigger asChild>
          <button
            className={cn(
              'w-full h-14 rounded-xl border bg-background/50 backdrop-blur-sm',
              'flex items-center justify-between px-4 cursor-pointer transition-all',
              'hover:bg-accent/10 hover:border-accent/50',
              !localColor && 'border-dashed'
            )}
            type="button"
          >
            <div className="flex items-center gap-3">
              <div
                className="size-6 rounded-md border shadow-sm transition-colors"
                style={{ backgroundColor: safeColor }}
              />
              <span className="text-sm font-medium uppercase text-muted-foreground">
                {localColor || 'Выберите цвет...'}
              </span>
            </div>
          </button>
        </PopoverTrigger>

        <PopoverContent className="w-[280px] bg-background/90 backdrop-blur-xl border rounded-2xl p-4 shadow-xl">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                readOnly
                className="h-10 font-mono bg-muted/50"
                value={localColor.toUpperCase()}
              />
              <Button
                size="icon"
                variant="outline"
                onClick={handleRandomize}
              >
                <Shuffle className="size-4" />
              </Button>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  className={cn(
                    'size-8 rounded-md border transition-all hover:scale-110',
                    localColor.toUpperCase() === c.toUpperCase() &&
                      'ring-2 ring-primary ring-offset-2'
                  )}
                  key={c}
                  style={{ backgroundColor: c }}
                  type="button"
                  onClick={() => {
                    setLocalColor(c)
                    onChange(c)
                  }}
                />
              ))}
            </div>

            <HexColorPicker
              className="!w-full"
              color={safeColor}
              onChange={newColor => {
                setLocalColor(newColor)
                throttledOnChange(newColor)
              }}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
