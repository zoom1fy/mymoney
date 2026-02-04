// src/components/dashboard/categories/CategoryItemSkeleton.tsx
'use client'

export function CategoryItemSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 animate-pulse">
      {/* Круглая иконка */}
      <div className="size-16 rounded-full bg-muted/30 border border-muted/40" />

      {/* Название категории */}
      <div className="h-4 w-20 bg-muted/40 rounded-full" />

      {/* Сумма */}
      <div className="h-3.5 w-16 bg-muted/30 rounded-full" />
    </div>
  )
}
