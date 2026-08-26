import { DashboardShell } from '@/components/dashboard/dashboard-shell'

export const metadata = {
  title: 'Дашборд'
}

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  return <DashboardShell>{children}</DashboardShell>
}
