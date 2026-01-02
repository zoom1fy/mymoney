import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/buttons/button'

interface AccentButtonProps
  extends React.ComponentPropsWithoutRef<typeof Button> {
  children: React.ReactNode
}

export function AccentButton({
  className,
  size = 'lg',
  children,
  ...props
}: AccentButtonProps) {
  return (
    <Button
      size={size}
      className={cn(
        'rounded-full bg-accent text-accent-foreground font-medium',
        'hover:bg-accent/90 transition-all',
        // Разные размеры — чтобы было удобно использовать
        size === 'lg' && 'h-12 px-10 text-base',
        size === 'default' && 'h-11 px-8',
        size === 'sm' && 'h-10 px-6 text-sm',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}
