import { Metadata } from 'next'

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

      {/* Здесь позже будет общая статистика, графики и т.д. */}
      <div className="rounded-2xl border bg-card/50 backdrop-blur-sm p-10 text-center">
        <p className="text-2xl font-medium text-muted-foreground">
          Выберите счёт в боковом меню, чтобы начать
        </p>
      </div>
    </div>
  )
}
