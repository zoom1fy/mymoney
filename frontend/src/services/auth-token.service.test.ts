import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGet, mockSet, mockRemove } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockSet: vi.fn(),
  mockRemove: vi.fn(),
}))

vi.mock('js-cookie', () => ({
  default: {
    get: mockGet,
    set: mockSet,
    remove: mockRemove,
  },
}))

describe('auth-token service', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockSet.mockReset()
    mockRemove.mockReset()
  })

  describe('getAccessToken', () => {
    it('returns the token when cookie exists', async () => {
      mockGet.mockReturnValueOnce('my-token')
      const { getAccessToken, EnumTokens } = await import('./auth-token.service')
      expect(getAccessToken()).toBe('my-token')
      expect(mockGet).toHaveBeenCalledWith(EnumTokens.ACCESS_TOKEN)
    })

    it('returns null when cookie is missing', async () => {
      mockGet.mockReturnValueOnce(undefined)
      const { getAccessToken } = await import('./auth-token.service')
      expect(getAccessToken()).toBeNull()
    })
  })

  describe('saveTokenStorage', () => {
    it('sets the cookie with correct options', async () => {
      const { saveTokenStorage, EnumTokens } = await import('./auth-token.service')
      saveTokenStorage('new-token')
      expect(mockSet).toHaveBeenCalledWith(EnumTokens.ACCESS_TOKEN, 'new-token', {
        sameSite: 'lax',
        expires: 1,
        secure: false,
        path: '/',
      })
    })
  })

  describe('removeTokenStorage', () => {
    it('removes the access token cookie', async () => {
      const { removeTokenStorage, EnumTokens } = await import('./auth-token.service')
      removeTokenStorage()
      expect(mockRemove).toHaveBeenCalledWith(EnumTokens.ACCESS_TOKEN, {
        path: '/',
      })
    })
  })
})
