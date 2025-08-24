import { axiosWithAuth } from '../api/interceptor'
import { IAuthForm, IUser } from '../types/auth.types'

export const userService = {
  async getProfile() {
    const response = await axiosWithAuth.get<IUser>('/user/profile')
    return response.data
  },

  async updateProfile(data: Partial<IAuthForm>) {
    const response = await axiosWithAuth.patch<IUser>('/user/profile', data)
    return response.data
  },

  async getById(id: string) {
    const response = await axiosWithAuth.get<IUser>(`/user/${id}`)
    return response.data
  },

  async deleteUser(id: string) {
    // если на бэке будет DELETE /user/:id
    const response = await axiosWithAuth.delete<void>(`/user/${id}`)
    return response.data
  }
}
