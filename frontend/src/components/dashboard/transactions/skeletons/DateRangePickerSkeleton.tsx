'use client'

export function DateRangePickerSkeleton() {
  return (
    <div className="flex flex-col items-center gap-3 animate-pulse">
      {/* Presets */}
      <div className="grid grid-cols-4 gap-2 w-full max-w-md">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`
              h-9 w-full rounded-lg border
              ${
                i === 2
                  ? 'bg-primary/25 border-primary/30'
                  : 'bg-muted/25 border-muted/40'
              }
            `}
          />
        ))}
      </div>

      {/* Arrows + picker */}
      <div className="flex items-center justify-center gap-2">
        {/* left arrow */}
        <div className="size-9 rounded-md bg-muted/30 border border-muted/40" />

        {/* range picker */}
        <div className="h-9 w-[220px] rounded-md bg-muted/25 border border-muted/40 flex items-center px-3 gap-2">
          <div className="flex-1 h-4 bg-muted/40 rounded" />
          <div className="w-3 h-3 bg-muted/40 rounded-full" />
          <div className="flex-1 h-4 bg-muted/40 rounded" />
        </div>

        {/* right arrow */}
        <div className="size-9 rounded-md bg-muted/30 border border-muted/40" />
      </div>
    </div>
  )
}
