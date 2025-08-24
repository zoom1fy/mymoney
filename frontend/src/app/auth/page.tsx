import { Auth } from './Auth'
import { Metadata } from 'next'

import { NO_INDEX_PAGE } from '@/constants/seo.constants'

export const metadata: Metadata = {
  title: 'Auth',
  ...NO_INDEX_PAGE
}

export default function AuthPage() {
  return (
    <div className="relative">
      <Auth />
    </div>
  )
}
