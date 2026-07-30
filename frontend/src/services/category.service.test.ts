import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGet, mockPost, mockPatch, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPatch: vi.fn(),
  mockDelete: vi.fn(),
}))

vi.mock('../api/interceptor', () => ({
  axiosWithAuth: {
    get: mockGet,
    post: mockPost,
    patch: mockPatch,
    delete: mockDelete,
  },
}))

describe('categoryService', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockPost.mockReset()
    mockPatch.mockReset()
    mockDelete.mockReset()
  })

  it('create posts to /category', async () => {
    mockPost.mockResolvedValueOnce({ data: { id: 1, name: 'Food' } })
    const { categoryService } = await import('./category.service')
    const result = await categoryService.create({ name: 'Food', isExpense: true } as any)
    expect(mockPost).toHaveBeenCalledWith('/category', { name: 'Food', isExpense: true })
    expect(result).toEqual({ id: 1, name: 'Food' })
  })

  it('getAll fetches from /category', async () => {
    mockGet.mockResolvedValueOnce({ data: [{ id: 1 }] })
    const { categoryService } = await import('./category.service')
    const result = await categoryService.getAll()
    expect(mockGet).toHaveBeenCalledWith('/category')
    expect(result).toEqual([{ id: 1 }])
  })

  it('getArchived fetches from /category/archived', async () => {
    mockGet.mockResolvedValueOnce({ data: [{ id: 2 }] })
    const { categoryService } = await import('./category.service')
    const result = await categoryService.getArchived()
    expect(mockGet).toHaveBeenCalledWith('/category/archived')
    expect(result).toEqual([{ id: 2 }])
  })

  it('unarchive patches to /category/:id/unarchive', async () => {
    mockPatch.mockResolvedValueOnce({ data: { id: 2, isArchived: false } })
    const { categoryService } = await import('./category.service')
    const result = await categoryService.unarchive(2)
    expect(mockPatch).toHaveBeenCalledWith('/category/2/unarchive')
    expect(result).toEqual({ id: 2, isArchived: false })
  })

  it('getById fetches from /category/:id', async () => {
    mockGet.mockResolvedValueOnce({ data: { id: 3 } })
    const { categoryService } = await import('./category.service')
    const result = await categoryService.getById(3)
    expect(mockGet).toHaveBeenCalledWith('/category/3')
    expect(result).toEqual({ id: 3 })
  })

  it('update patches to /category/:id', async () => {
    mockPatch.mockResolvedValueOnce({ data: { id: 1, name: 'Updated' } })
    const { categoryService } = await import('./category.service')
    const result = await categoryService.update(1, { name: 'Updated' } as any)
    expect(mockPatch).toHaveBeenCalledWith('/category/1', { name: 'Updated' })
    expect(result).toEqual({ id: 1, name: 'Updated' })
  })

  it('delete sends DELETE to /category/:id', async () => {
    mockDelete.mockResolvedValueOnce({ data: { success: true } })
    const { categoryService } = await import('./category.service')
    const result = await categoryService.delete(1)
    expect(mockDelete).toHaveBeenCalledWith('/category/1')
    expect(result).toEqual({ success: true })
  })
})
