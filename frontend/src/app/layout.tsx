import './globals.css'
import { Providers } from './providers'
import type { Metadata } from 'next'
import { Toaster } from 'sonner'

import { SITE_NAME } from '@/constants/seo.constants'

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
      lang="ru"
      suppressHydrationWarning
    >
      <body className="antialiased">
        <Providers>
          {children}
          <Toaster
            theme="dark"
            position="bottom-right"
            duration={1500}
          />
        </Providers>
      </body>
    </html>
  )
}

function setLoading(arg0: boolean) {
  throw new Error('Function not implemented.')
}
