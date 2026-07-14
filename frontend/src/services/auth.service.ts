import { axiosClassic } from '@/api/interceptor'

import { IAuthForm, IAuthResponse } from '@/types/auth.type'

import { removeTokenStorage, saveTokenStorage } from './auth-token.service'

// Persist access token in a client-accessible cookie after any auth action that returns one
export const authService = {
  async login(data: IAuthForm) {
    const response = await axiosClassic.post<IAuthResponse>(
      '/auth/login',
      data
    )

    if (response.data.accessToken) saveTokenStorage(response.data.accessToken)

    return response
  },

  async register(data: IAuthForm) {
    return axiosClassic.post<{ email: string }>('/auth/register', data)
  },

  async verifyEmail(data: { email: string; code: string }) {
    const response = await axiosClassic.post<IAuthResponse>(
      '/auth/verify-email',
      data
    )

    if (response.data.accessToken) saveTokenStorage(response.data.accessToken)

    return response
  },

  async resendCode(email: string) {
    return axiosClassic.post<{ message: string }>('/auth/resend-code', {
      email
    })
  },

  // Request a new access token using the httpOnly refresh cookie (sent automatically withCredentials)
  async getNewTokens() {
    const response = await axiosClassic.post<IAuthResponse>(
      '/auth/login/access-token'
    )

    if (response.data.accessToken) saveTokenStorage(response.data.accessToken)

    return response
  },

  async logout() {
    const response = await axiosClassic.post<boolean>('/auth/logout')

    if (response.data) removeTokenStorage()

    return response
  }
}
