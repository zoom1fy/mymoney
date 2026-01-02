// app/auth/page.tsx
import { Auth } from './Auth'
import { Metadata } from 'next'

import { NO_INDEX_PAGE } from '@/constants/seo.constants'

export const metadata: Metadata = {
  title: 'Вход / Регистрация',
  description: 'Войдите или создайте аккаунт в MyMoney',
  ...NO_INDEX_PAGE
}

export default function AuthPage() {
  return <Auth />
}
