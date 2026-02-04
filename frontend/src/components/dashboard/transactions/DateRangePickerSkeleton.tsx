'use client'

export function DateRangePickerSkeleton() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 animate-pulse">
      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`
              h-8 px-4 rounded-md
              ${
                i === 2
                  ? 'w-18 lg:w-24 h-8 bg-primary/25 border border-primary/30'
                  : 'w-18 lg:w-24 h-8 bg-muted/25 border border-muted/40'
              }
            `}
          />
        ))}
      </div>

      {/* Стрелки + поле */}
      <div className="flex items-center gap-2">
        {/* Стрелка влево */}
        <div className="size-9 rounded-md bg-muted/30 border border-muted/40 flex items-center justify-center">
          <div className="w-3 h-1 bg-muted/50 rounded" />
        </div>

        {/* Поле RangePicker */}
        <div className="h-9 w-[220px] rounded-md bg-muted/25 border border-muted/40 flex items-center px-3">
          <div className="flex-1 h-4 bg-muted/40 rounded" />
          <div className="w-4 h-4 bg-muted/40 rounded-full mx-2" />
          <div className="flex-1 h-4 bg-muted/40 rounded" />
        </div>

        {/* Стрелка вправо */}
        <div className="size-9 rounded-md bg-muted/30 border border-muted/40 flex items-center justify-center">
          <div className="w-4 h-1 bg-muted/50 rounded" />
        </div>
      </div>
    </div>
  )
}
