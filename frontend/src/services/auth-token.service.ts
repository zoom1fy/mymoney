import Cookies from 'js-cookie'

export enum EnumTokens {
  ACCESS_TOKEN = 'accessToken',
  REFRESH_TOKEN = 'refresh_token'
}

export const getAccessToken = () => {
  const accessToken = Cookies.get(EnumTokens.ACCESS_TOKEN)
  return accessToken || null
}

export const saveTokenStorage = (accessToken: string) => {
  Cookies.set(EnumTokens.ACCESS_TOKEN, accessToken, {
    sameSite: 'strict',
    expires: 1, // 1 день
    secure: process.env.NODE_ENV === 'production'
  })
}

export const removeTokenStorage = () => {
  Cookies.remove(EnumTokens.ACCESS_TOKEN)
}
