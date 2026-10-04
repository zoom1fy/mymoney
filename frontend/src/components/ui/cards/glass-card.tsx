import { type VariantProps, cva } from 'class-variance-authority'

import { Card } from '@/components/ui/shadui/card'

import { cn } from '@/lib/cn'

const glassCardVariants = cva('relative overflow-hidden border', {
  variants: {
    variant: {
      glass: 'bg-background/40 backdrop-blur-md dark:border-white/10',
      solid: 'bg-card dark:border-white/10'
    }
  },
  defaultVariants: {
    variant: 'glass'
  }
})

interface GlassCardProps
  extends
    React.ComponentPropsWithoutRef<typeof Card>,
    VariantProps<typeof glassCardVariants> {}

export function GlassCard({
  children,
  className,
  variant = 'glass',
  ...props
}: GlassCardProps) {
  return (
    <Card
      className={cn(
        glassCardVariants({ variant }),
        'transition-shadow duration-200 hover:shadow-2xl',
        className
      )}
      data-variant={variant}
      {...props}
    >
      {children}
    </Card>
  )
}
