import { Chart } from './chart/Chart'
import { Sidebar } from './sidebar/Sidebar'
import { Metadata } from 'next'

import { NO_INDEX_PAGE } from '@/constants/seo.constants'

export const metadata: Metadata = {
  title: 'Dashboard',
  ...NO_INDEX_PAGE
}

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 overflow-x-hidden w-full">
        <Chart />
      </main>
    </div>
  )
}
