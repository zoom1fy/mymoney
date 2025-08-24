import { axiosWithAuth } from "../api/interceptor"
import { ICategory, ICreateCategory, IUpdateCategory } from "../types/category.types"

export const categoryService = {
  async create(data: ICreateCategory) {
    const response = await axiosWithAuth.post<ICategory>("/categories", data)
    return response.data
  },

  async getAll() {
    const response = await axiosWithAuth.get<ICategory[]>("/categories")
    return response.data
  },

  async getById(id: number) {
    const response = await axiosWithAuth.get<ICategory>(`/categories/${id}`)
    return response.data
  },

  async update(id: number, data: IUpdateCategory) {
    const response = await axiosWithAuth.patch<ICategory>(`/categories/${id}`, data)
    return response.data
  },

  async delete(id: number) {
    const response = await axiosWithAuth.delete<{ message: string }>(`/categories/${id}`)
    return response.data
  }
}
