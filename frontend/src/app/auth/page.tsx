// app/auth/page.tsx
import { Metadata } from 'next'

import { noIndexPage } from '@/constants/seo.constants'

import { Auth } from './auth-form'

export const metadata: Metadata = {
  title: 'Вход / Регистрация',
  description: 'Войдите или создайте аккаунт в MyMoney',
  ...noIndexPage
}

export default function AuthPage() {
  return <Auth />
}
