import { dashboardPages } from '@/config/pages-url.config'
import { EnumTokens } from './services/auth-token.service'
import { NextRequest, NextResponse } from 'next/server'

// Redirect unauthenticated users to /auth and authenticated users away from /auth
export async function middleware(request: NextRequest) {
  // Desktop build ships static files with no auth — AuthGuard handles routing
  if (process.env.NEXT_PLATFORM === 'desktop') {
    return NextResponse.next()
  }

  const { url, cookies } = request

  const refreshToken = cookies.get(EnumTokens.REFRESH_TOKEN)?.value
  const accessToken = cookies.get(EnumTokens.ACCESS_TOKEN)?.value
  const isAuthenticated = !!refreshToken || !!accessToken

  const isAuthPage = url.includes('/auth')

  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL(dashboardPages.HOME, request.url))
  }

  if (!isAuthPage && !isAuthenticated) {
    return NextResponse.redirect(new URL(dashboardPages.AUTH, request.url))
  }

  return NextResponse.next()
}

// Only run on protected (/me) and public-auth (/auth) routes — not every page
export const config = {
  matcher: ['/me/:path*', '/auth/:path*']
}
