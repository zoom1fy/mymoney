'use client'

import { isTauri } from '@/lib/platform'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// The landing page is web-only; the desktop app starts straight in the dashboard
export function DesktopRedirect({ to }: { to: string }) {
  const router = useRouter()

  useEffect(() => {
    if (isTauri()) {
      router.replace(to)
    }
  }, [to, router])

  return null
}
