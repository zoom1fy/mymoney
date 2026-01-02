import { cn } from '@/lib/utils'

interface GlassBadgeProps {
  children: React.ReactNode
  className?: string
}

export function GlassBadge({ children, className }: GlassBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm',
        'bg-background/40 backdrop-blur-md',
        'border-white/20 dark:border-white/10',
        'text-foreground',
        className
      )}
    >
      {children}
    </span>
  )
}
