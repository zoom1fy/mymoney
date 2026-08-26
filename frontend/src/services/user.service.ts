import { isTauri } from '../lib/platform'
import { axiosWithAuth } from '../api/interceptor'
import { userLocalService } from './local/user.service'
import { IUser } from '../types/auth.type'

const userServiceHttp = {
  async getProfile() {
    const response = await axiosWithAuth.get<IUser>('/user/profile')
    return response.data
  },

  async updateProfile(data: {
    email?: string
    password?: string
    currentPassword: string
  }) {
    const response = await axiosWithAuth.patch<IUser>('/user/profile', data)
    return response.data
  },

  async getById(id: string) {
    const response = await axiosWithAuth.get<IUser>(`/user/${id}`)
    return response.data
  },

  async deleteUser(id: string) {
    const response = await axiosWithAuth.delete<void>(`/user/${id}`)
    return response.data
  }
}

export const userService = isTauri() ? userLocalService : userServiceHttp
