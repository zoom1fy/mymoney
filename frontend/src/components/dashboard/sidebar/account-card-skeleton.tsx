'use client'

export function AccountCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 px-4 py-3.5 flex items-center gap-3">
      <div className="shrink-0 size-11 rounded-xl bg-muted/40 border border-muted/30" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="h-4 w-24 bg-muted/40 rounded-full" />
        <div className="h-6 w-28 bg-muted/30 rounded-full" />
      </div>
    </div>
  )
}
