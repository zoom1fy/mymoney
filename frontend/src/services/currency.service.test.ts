import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }))

vi.mock('../api/interceptor', () => ({
  axiosWithAuth: {
    get: mockGet,
  },
}))

describe('currencyService', () => {
  beforeEach(() => {
    mockGet.mockReset()
  })

  it('returns currency list from /currency', async () => {
    const expected = [
      { code: 'RUB', name: 'Российский рубль', symbol: '₽', type: 'FIAT' },
      { code: 'BTC', name: 'Bitcoin', symbol: '₿', type: 'CRYPTO' },
    ]
    mockGet.mockResolvedValueOnce({ data: expected })

    const { currencyService } = await import('./currency.service')

    const result = await currencyService.getAll()

    expect(mockGet).toHaveBeenCalledWith('/currency')
    expect(result).toEqual(expected)
  })

  it('propagates network errors', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network Error'))

    const { currencyService } = await import('./currency.service')

    await expect(currencyService.getAll()).rejects.toThrow('Network Error')
  })
})
