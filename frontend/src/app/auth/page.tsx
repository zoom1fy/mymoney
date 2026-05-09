// app/auth/page.tsx
import { Metadata } from 'next'

import { NO_INDEX_PAGE } from '@/constants/seo.constants'

import { Auth } from './Auth'

export const metadata: Metadata = {
  title: 'Вход / Регистрация',
  description: 'Войдите или создайте аккаунт в MyMoney',
  ...NO_INDEX_PAGE
}

export default function AuthPage() {
  return <Auth />
}
