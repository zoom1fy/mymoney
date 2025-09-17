// src/components/ui/category-badge/CategoryBadge.tsx
import styles from './CategoryBadge.module.scss'
import * as Icons from 'lucide-react'
import { ICategory } from '@/types/category.types'

interface CategoryBadgeProps {
  category: ICategory
  color: string
  hoverColor?: string // Новый пропс для цвета ховера
  value: number
}

export function CategoryBadge({ category, color, hoverColor, value }: CategoryBadgeProps) {
  // Приводим к словарю компонентов
  const LucideIcons = Icons as unknown as Record<string, React.FC<any>>
  // Берём название иконки из БД, например "ShoppingCart"
  const IconComponent = LucideIcons[category.icon || 'Circle']

  return (
    <div
      className={styles.badge}
      onMouseEnter={(e) => {
        if (hoverColor) {
          e.currentTarget.style.backgroundColor = hoverColor
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
    >
      <div
        className={styles.iconWrapper}
        style={{ backgroundColor: color }}
      >
        {IconComponent ? (
          <IconComponent
            size={32} // сделал больше
            color="#fff"
            strokeWidth={2.5}
          />
        ) : (
          <Icons.Circle
            size={32}
            color="#fff"
          />
        )}
      </div>
      <span className={styles.label}>{category.name}</span>
      <span className={styles.value}>{value.toLocaleString()} ₽</span>
    </div>
  )
}
