import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCategories } from './use-categories'
import { categoryService } from '@/services/category.service'
import React from 'react'

vi.mock('@/services/category.service', () => ({
  categoryService: {
    getAll: vi.fn(),
    getArchived: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    unarchive: vi.fn(),
  },
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty arrays before data loads', () => {
    vi.mocked(categoryService.getAll).mockResolvedValueOnce([])
    vi.mocked(categoryService.getArchived).mockResolvedValueOnce([])
    const { result } = renderHook(() => useCategories(true), { wrapper: createWrapper() })
    expect(result.current.categories).toEqual([])
    expect(result.current.archived).toEqual([])
    expect(result.current.isLoading).toBe(true)
  })

  it('returns categories and archived lists', async () => {
    const categories = [{ id: 1, name: 'Food', icon: '🍕', color: '#ff0000', isExpense: true, isArchived: false }]
    const archived = [{ id: 2, name: 'Old', icon: '📦', color: '#ccc', isExpense: true, isArchived: true }]
    vi.mocked(categoryService.getAll).mockResolvedValueOnce(categories as any)
    vi.mocked(categoryService.getArchived).mockResolvedValueOnce(archived as any)

    const { result } = renderHook(() => useCategories(true), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.categories).toEqual(categories)
    expect(result.current.archived).toEqual(archived)
  })

  it('createCategory calls service and returns', async () => {
    vi.mocked(categoryService.getAll).mockResolvedValueOnce([])
    vi.mocked(categoryService.getArchived).mockResolvedValueOnce([])
    vi.mocked(categoryService.create).mockResolvedValueOnce({ id: 3, name: 'New Cat' } as any)

    const { result } = renderHook(() => useCategories(true), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.createCategory({ name: 'New Cat', isExpense: true } as any)

    expect(categoryService.create).toHaveBeenCalledWith({ name: 'New Cat', isExpense: true })
  })

  it('updateCategory calls service with correct params', async () => {
    vi.mocked(categoryService.getAll).mockResolvedValueOnce([{ id: 1, name: 'Old Cat' }] as any)
    vi.mocked(categoryService.getArchived).mockResolvedValueOnce([])
    vi.mocked(categoryService.update).mockResolvedValueOnce({ id: 1, name: 'Updated' } as any)

    const { result } = renderHook(() => useCategories(true), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.updateCategory({ id: 1, data: { name: 'Updated' } as any })

    expect(categoryService.update).toHaveBeenCalledWith(1, { name: 'Updated' })
  })

  it('deleteCategory calls service', async () => {
    vi.mocked(categoryService.getAll).mockResolvedValueOnce([{ id: 1, name: 'ToDelete' }] as any)
    vi.mocked(categoryService.getArchived).mockResolvedValueOnce([])
    vi.mocked(categoryService.delete).mockResolvedValueOnce({ success: true })

    const { result } = renderHook(() => useCategories(true), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.deleteCategory(1)

    expect(categoryService.delete).toHaveBeenCalledWith(1)
  })

  it('unarchiveCategory calls service and returns', async () => {
    vi.mocked(categoryService.getAll).mockResolvedValueOnce([])
    vi.mocked(categoryService.getArchived).mockResolvedValueOnce([{ id: 5, name: 'Archived' }] as any)
    vi.mocked(categoryService.unarchive).mockResolvedValueOnce({ id: 5, name: 'Unarchived' } as any)

    const { result } = renderHook(() => useCategories(true), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.unarchiveCategory(5)

    expect(categoryService.unarchive).toHaveBeenCalledWith(5)
  })
})
