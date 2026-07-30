import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }))

vi.mock('../api/interceptor', () => ({
  axiosWithAuth: {
    get: mockGet,
  },
}))

describe('dashboardService', () => {
  beforeEach(() => { mockGet.mockReset() })

  it('getDashboard fetches from /dashboard with from/to params', async () => {
    const response = {
      profile: { id: 1, email: 'test@test.com' },
      accounts: [],
      categories: [],
      archivedCategories: [],
      expenseSummary: [],
      incomeSummary: [],
    }
    mockGet.mockResolvedValueOnce({ data: response })

    const { dashboardService } = await import('./dashboard.service')
    const result = await dashboardService.getDashboard('2024-01-01', '2024-01-31')

    expect(mockGet).toHaveBeenCalledWith('/dashboard', {
      params: { from: '2024-01-01', to: '2024-01-31' },
    })
    expect(result).toEqual(response)
  })
})
