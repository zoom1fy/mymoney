import { removeTokenStorage, saveTokenStorage } from './auth-token.service'
import { axiosClassic } from '@/api/interceptor'

import { IAuthForm, IAuthResponse } from '@/types/auth.types'

export const authService = {
  async main(type: 'login' | 'register', data: IAuthForm) {
    const response = await axiosClassic.post<IAuthResponse>(
      `/auth/${type}`,
      data
    )

    if (response.data.accessToken) saveTokenStorage(response.data.accessToken)

    return response
  },

  async getNewTokens() {
    const response = await axiosClassic.post<IAuthResponse>(
      `/auth/login/access-token`
    )

    if (response.data.accessToken) saveTokenStorage(response.data.accessToken)

    return response
  },

  async logout() {
    const response = await axiosClassic.post<boolean>(`/auth/logout`)

    if (response.data) removeTokenStorage()

    return response
  }
}
