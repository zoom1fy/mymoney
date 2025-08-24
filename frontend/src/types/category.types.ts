import { CurrencyCode } from './account.types'
// можно вынести в отдельный enums.types.ts, но пока берём отсюда
import { IBase } from './root.types'

/**
 * Интерфейс создания категории (фронт → бэк)
 */
export interface ICreateCategory {
  name: string
  currencyCode: CurrencyCode
  isExpense: boolean
  parentId?: number
  icon?: string
}

/**
 * Полная категория (бэк → фронт)
 */
export interface ICategory extends ICreateCategory, IBase {}

/**
 * Интерфейс обновления категории (частичное обновление)
 */
export type IUpdateCategory = Partial<ICreateCategory>
