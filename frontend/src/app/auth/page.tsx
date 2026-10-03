import { Metadata } from 'next'

import { noIndexPage } from '@/constants/seo.constants'

import { Auth } from './auth-form'

export const metadata: Metadata = {
  title: 'Вход / Регистрация',
  description: 'Войдите или создайте аккаунт в MyMoney',
  ...noIndexPage
}

export default function AuthPage() {
  // The desktop build strips this route entirely, so it is web-only
  return <Auth />
}
