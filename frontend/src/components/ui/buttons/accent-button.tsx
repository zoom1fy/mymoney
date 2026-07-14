import { Button } from '@/components/ui/shadui/button'

import { cn } from '@/lib/cn'

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
      className={cn(
        'rounded-full bg-accent text-accent-foreground font-medium cursor-pointer',
        'hover:bg-accent/90 transition-all',
        // Semantic sizes that map cleanly to the design system
        size === 'lg' && 'h-12 px-10 text-xl',
        size === 'default' && 'h-11 px-8',
        size === 'sm' && 'h-10 px-6 text-sm',
        className
      )}
      size={size}
      {...props}
    >
      {children}
    </Button>
  )
}
