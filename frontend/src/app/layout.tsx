import type { Metadata } from 'next'
import { Toaster } from 'sonner'

import { SITE_NAME } from '@/constants/seo.constants'

import './globals.css'
import { Providers } from './providers'

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

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      suppressHydrationWarning
      lang="ru"
    >
      <body className="antialiased">
        <Providers>
          {children}
          <Toaster
            duration={1500}
            position="bottom-right"
            theme="dark"
          />
        </Providers>
      </body>
    </html>
  )
}