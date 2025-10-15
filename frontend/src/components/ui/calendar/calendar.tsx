'use client'

import styles from './Calendar.module.scss'
import { Button } from './button'
import { cn } from '@/lib/utils'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import * as React from 'react'
import { DayButton, DayPicker, getDefaultClassNames } from 'react-day-picker'

function Calendar({
  className,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays
      className={cn(styles.calendar, className)}
      classNames={{
        ...defaultClassNames,
        root: cn('w-fit', defaultClassNames.root),
        day: cn(defaultClassNames.day, styles.dayButton)
      }}
      components={{
        Chevron: ({ orientation, ...props }) => {
          // убираем size из props, чтобы TS не ругался
          const { size, ...rest } = props as any

          return orientation === 'left' ? (
            <Button
              variant="ghost"
              size="icon"
              {...rest}
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              {...rest}
            >
              <ChevronRightIcon className="w-4 h-4" />
            </Button>
          )
        },
        DayButton: CalendarDayButton
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(styles.dayButton, className)}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
