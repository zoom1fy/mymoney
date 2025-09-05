import { axiosWithAuth } from '../api/interceptor'
import {
  ICategory,
  ICreateCategory,
  IUpdateCategory
} from '../types/category.types'

export const categoryService = {
  async create(data: ICreateCategory) {
    const response = await axiosWithAuth.post<ICategory>('/category', data)
    return response.data
  },

  async getAll() {
    const response = await axiosWithAuth.get<ICategory[]>('/category')
    return response.data
  },

  async getById(id: number) {
    const response = await axiosWithAuth.get<ICategory>(`/category/${id}`)
    return response.data
  },

  async update(id: number, data: IUpdateCategory) {
    const response = await axiosWithAuth.patch<ICategory>(
      `/category/${id}`,
      data
    )
    return response.data
  },

  async delete(id: number) {
    const response = await axiosWithAuth.delete<{ message: string }>(
      `/category/${id}`
    )
    return response.data
  }
}
