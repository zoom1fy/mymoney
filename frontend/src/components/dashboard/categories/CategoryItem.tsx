import { cn } from '@/lib/utils'

import { CategoryIconName, CategoryIcons } from '@/types/category.types'

interface Props {
  name: string
  icon?: CategoryIconName
}

export function CategoryItem({ name, icon }: Props) {
  const Icon = (icon && CategoryIcons[icon]) || CategoryIcons.Circle

  return (
    <div className="flex flex-col items-center gap-2 group cursor-pointer">
      <div
        className={cn(
          'size-16 rounded-full border bg-card/40 backdrop-blur-sm',
          'flex items-center justify-center transition-all',
          'group-hover:bg-card/70 group-hover:border-accent/40 group-hover:shadow-md'
        )}
      >
        <Icon className="size-7 text-accent" />
      </div>

      <p className="text-sm text-center font-medium text-muted-foreground group-hover:text-foreground">
        {name}
      </p>
    </div>
  )
}
