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

describe('accountService', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockPost.mockReset()
    mockPatch.mockReset()
    mockDelete.mockReset()
  })

  it('create posts to /accounts', async () => {
    mockPost.mockResolvedValueOnce({ data: { id: 1, name: 'Test' } })
    const { accountService } = await import('./account.service')
    const result = await accountService.create({ name: 'Test', currencyCode: 'RUB', balance: 0 } as any)
    expect(mockPost).toHaveBeenCalledWith('/accounts', { name: 'Test', currencyCode: 'RUB', balance: 0 })
    expect(result).toEqual({ id: 1, name: 'Test' })
  })

  it('getAll fetches from /accounts', async () => {
    mockGet.mockResolvedValueOnce({ data: [{ id: 1 }] })
    const { accountService } = await import('./account.service')
    const result = await accountService.getAll()
    expect(mockGet).toHaveBeenCalledWith('/accounts')
    expect(result).toEqual([{ id: 1 }])
  })

  it('getById fetches from /accounts/:id', async () => {
    mockGet.mockResolvedValueOnce({ data: { id: 42 } })
    const { accountService } = await import('./account.service')
    const result = await accountService.getById(42)
    expect(mockGet).toHaveBeenCalledWith('/accounts/42')
    expect(result).toEqual({ id: 42 })
  })

  it('update patches to /accounts/:id', async () => {
    mockPatch.mockResolvedValueOnce({ data: { id: 1, name: 'Updated' } })
    const { accountService } = await import('./account.service')
    const result = await accountService.update(1, { name: 'Updated' } as any)
    expect(mockPatch).toHaveBeenCalledWith('/accounts/1', { name: 'Updated' })
    expect(result).toEqual({ id: 1, name: 'Updated' })
  })

  it('delete sends DELETE to /accounts/:id', async () => {
    mockDelete.mockResolvedValueOnce({ data: { message: 'deleted' } })
    const { accountService } = await import('./account.service')
    const result = await accountService.delete(1)
    expect(mockDelete).toHaveBeenCalledWith('/accounts/1')
    expect(result).toEqual({ message: 'deleted' })
  })
})
