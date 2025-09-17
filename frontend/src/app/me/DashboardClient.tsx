'use client'

import { Chart } from './chart/Chart'
import { Sidebar } from './sidebar/Sidebar'
import { useState } from 'react'

export function DashboardClient() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="flex min-h-screen">
      <Sidebar
        refreshKey={refreshKey}
        setRefreshKey={setRefreshKey}
      />
      <main className="flex-1 p-6 overflow-x-hidden w-full">
        <Chart onTransactionSuccess={() => setRefreshKey(prev => prev + 1)} />
      </main>
    </div>
  )
}
