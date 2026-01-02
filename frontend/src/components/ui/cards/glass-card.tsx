import { cn } from '@/lib/utils'

import { Card } from '@/components/ui/cards/card'

interface GlassCardProps extends React.ComponentPropsWithoutRef<typeof Card> {
  className?: string
}

export function GlassCard({ children, className, ...props }: GlassCardProps) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden border bg-background/40 backdrop-blur-md',
        'dark:bg-background/20 dark:border-white/10',
        'transition-all hover:shadow-2xl',
        className
      )}
      {...props}
    >
      {children}
    </Card>
  )
}
