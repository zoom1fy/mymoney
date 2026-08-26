'use client'

import { dashboardPages } from '@/config/pages-url.config'
import { isTauri } from '@/lib/platform'
import { getAccessToken } from '@/services/auth-token.service'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Desktop replacement for the server middleware: the local build has a single
// user and no auth flow, so every route is accessible without tokens.
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isTauri()) return

    const isAuthenticated = !!getAccessToken()
    const isAuthPage = pathname.startsWith(dashboardPages.AUTH)
    const isProtectedPage = pathname.startsWith(dashboardPages.HOME)

    if (isAuthPage && isAuthenticated) {
      router.replace(dashboardPages.HOME)
    } else if (isProtectedPage && !isAuthenticated) {
      router.replace(dashboardPages.AUTH)
    }
  }, [pathname, router])

  return <>{children}</>
}
