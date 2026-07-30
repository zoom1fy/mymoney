import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGetAccessToken, mockRemoveTokenStorage, mockGetNewTokens, mockToastError } = vi.hoisted(() => ({
  mockGetAccessToken: vi.fn(),
  mockRemoveTokenStorage: vi.fn(),
  mockGetNewTokens: vi.fn(),
  mockToastError: vi.fn(),
}))

vi.mock('../services/auth-token.service', () => ({
  getAccessToken: mockGetAccessToken,
  removeTokenStorage: mockRemoveTokenStorage,
}))

vi.mock('../services/auth.service', () => ({
  authService: { getNewTokens: mockGetNewTokens },
}))

vi.mock('sonner', () => ({
  toast: { error: mockToastError },
}))

describe('axios interceptors', () => {
  let fulfilledResponse: (res: any) => any
  let rejectedResponse: (err: any) => any
  let fulfilledRequest: (config: any) => any
  let rejectedAuthResponse: (err: any) => any
  let fulfilledAuthResponse: (res: any) => any

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('./interceptor')
    // axiosClassic interceptors
    const classicHandlers = (mod.axiosClassic.interceptors.response as any).handlers
    fulfilledResponse = classicHandlers[0].fulfilled
    rejectedResponse = classicHandlers[0].rejected
    // axiosWithAuth interceptors
    const authReqHandlers = (mod.axiosWithAuth.interceptors.request as any).handlers
    fulfilledRequest = authReqHandlers[0].fulfilled
    const authResHandlers = (mod.axiosWithAuth.interceptors.response as any).handlers
    fulfilledAuthResponse = authResHandlers[0].fulfilled
    rejectedAuthResponse = authResHandlers[0].rejected
  })

  describe('axiosClassic response interceptor', () => {
    it('passes through successful responses', () => {
      const data = { id: 1 }
      const result = fulfilledResponse({ data, status: 200 })
      expect(result).toEqual({ data, status: 200 })
    })

    it('shows toast on 429 and re-throws', () => {
      const error = { response: { status: 429, data: {} }, request: {} }
      expect(() => rejectedResponse(error)).toThrow()
      expect(mockToastError).toHaveBeenCalledWith('Слишком много запросов. Пожалуйста, подождите.')
    })

    it('re-throws non-429 errors', () => {
      const error = { response: { status: 500, data: {} }, request: {} }
      expect(() => rejectedResponse(error)).toThrow()
    })
  })

  describe('axiosWithAuth request interceptor', () => {
    it('attaches Bearer token when token exists', () => {
      mockGetAccessToken.mockReturnValue('my-jwt-token')
      const config = { headers: {} }
      const result = fulfilledRequest(config)
      expect(result.headers.Authorization).toBe('Bearer my-jwt-token')
    })

    it('does not attach token if token is missing', () => {
      mockGetAccessToken.mockReturnValue(null)
      const config = { headers: {} }
      const result = fulfilledRequest(config)
      expect(result.headers.Authorization).toBeUndefined()
    })
  })

  describe('axiosWithAuth response interceptor', () => {
    it('passes through successful responses', () => {
      const config = { data: 'ok', status: 200 }
      const result = fulfilledAuthResponse(config)
      expect(result).toEqual(config)
    })

    it('shows toast on 429 and re-throws', async () => {
      const error = { response: { status: 429, data: {} }, config: {} }
      await expect(rejectedAuthResponse(error)).rejects.toThrow()
      expect(mockToastError).toHaveBeenCalledWith('Слишком много запросов. Пожалуйста, подождите.')
    })

    it('attempts to refresh token on 401 without retry flag', async () => {
      mockGetNewTokens.mockRejectedValue(new Error('refresh failed'))
      const error = {
        response: { status: 401, data: {} },
        config: { isRetry: false },
      }
      try { await rejectedAuthResponse(error) } catch { /* expected */ }
      expect(mockGetNewTokens).toHaveBeenCalled()
    })

    it('removes token on jwt expired after refresh fails', async () => {
      mockGetNewTokens.mockRejectedValue(new Error('jwt expired'))
      const error = {
        response: { status: 401, data: { message: 'jwt expired' } },
        config: { isRetry: false },
      }
      try { await rejectedAuthResponse(error) } catch { /* expected */ }
      expect(mockRemoveTokenStorage).toHaveBeenCalled()
    })
  })
})
