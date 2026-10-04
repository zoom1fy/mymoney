import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'

import { SITE_NAME } from '@/constants/seo.constants'
import { AuthGuard } from '@/components/auth-guard'
import { ThemeToaster } from '@/components/ui/feedback/theme-toaster'

import './globals.css'
import { Providers } from './providers'

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-manrope',
  display: 'swap'
})

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`
  },
  description: 'Web app for financial accountin',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png'
  }
}

// suppressHydrationWarning needed because next-themes injects a class on <html> before hydration
export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      suppressHydrationWarning
      lang="ru"
      className={manrope.variable}
    >
      <body className="antialiased">
        <Providers>
          <AuthGuard>{children}</AuthGuard>
          <ThemeToaster />
        </Providers>
      </body>
    </html>
  )
}