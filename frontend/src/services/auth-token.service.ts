import Cookies from 'js-cookie'

export const EnumTokens = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token'
} as const

export const getAccessToken = () => {
  const accessToken = Cookies.get(EnumTokens.ACCESS_TOKEN)
  return accessToken || null
}

export const saveTokenStorage = (accessToken: string) => {
  Cookies.set(EnumTokens.ACCESS_TOKEN, accessToken, {
    sameSite: 'lax',
    expires: 1,
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  })
}

export const removeTokenStorage = () => {
  Cookies.remove(EnumTokens.ACCESS_TOKEN, {
    path: '/'
  })
}
