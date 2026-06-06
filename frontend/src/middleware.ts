import { DASHBOARD_PAGES } from '@/config/pages-url.config'
import { NextRequest, NextResponse } from 'next/server'

import { EnumTokens } from './services/auth-token.service'

export async function middleware(request: NextRequest) {
  const { url, cookies } = request

  const refreshToken = cookies.get(EnumTokens.REFRESH_TOKEN)?.value
  const accessToken = cookies.get(EnumTokens.ACCESS_TOKEN)?.value
  const isAuthenticated = !!refreshToken || !!accessToken

  const isAuthPage = url.includes('/auth')

  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL(DASHBOARD_PAGES.HOME, request.url))
  }

  if (!isAuthPage && !isAuthenticated) {
    return NextResponse.redirect(new URL(DASHBOARD_PAGES.AUTH, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/me/:path*', '/auth/:path*']
}
