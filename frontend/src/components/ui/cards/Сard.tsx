import { cn } from '@/lib/utils'
import * as React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl shadow-sm',
        className
      )}
      {...props}
    />
  )
}
function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('p-4', className)}
      {...props}
    />
  )
}
export { Card, CardContent }
