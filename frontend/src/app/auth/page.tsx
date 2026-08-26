import { Metadata } from 'next'

import { noIndexPage } from '@/constants/seo.constants'
import { dashboardPages } from '@/config/pages-url.config'
import { DesktopRedirect } from '@/components/desktop-redirect'

import { Auth } from './auth-form'

export const metadata: Metadata = {
  title: 'Вход / Регистрация',
  description: 'Войдите или создайте аккаунт в MyMoney',
  ...noIndexPage
}

export default function AuthPage() {
  return (
    <>
      {/* No registration in the desktop build — bounce to the dashboard */}
      <DesktopRedirect to={dashboardPages.HOME} />
      <Auth />
    </>
  )
}
