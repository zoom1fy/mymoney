import { Metadata } from 'next'
import { NO_INDEX_PAGE } from '@/constants/seo.constants'
import { Sidebar } from './sidebar/Sidebar'

export const metadata: Metadata = {
  title: 'Dashboard',
  ...NO_INDEX_PAGE
}

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">Добро пожаловать в Dashboard</h1>

        {/* Тестовый рендер карточки */}
      </main>
    </div>
  )
}
