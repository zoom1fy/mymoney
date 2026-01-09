import { Metadata } from 'next'

import { CategoriesPanel } from '@/components/dashboard/categories/CategoriesPanel'

import { NO_INDEX_PAGE } from '@/constants/seo.constants'

export const metadata: Metadata = {
  title: 'Дашборд',
  ...NO_INDEX_PAGE
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Обзор финансов</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Добро пожаловать обратно. Здесь вы можете управлять своими счетами и
          операциями.
        </p>
      </div>

      {/* Контент */}
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
        {/* Диаграмма */}
        <div className="flex-1 rounded-2xl border bg-card/50 backdrop-blur-sm p-6 lg:p-10">
          {/* Chart */}
        </div>

        {/* Категории */}
        <div className="lg:w-[360px]">
          <CategoriesPanel />
        </div>
      </div>
    </div>
  )
}
