import { describe, it, expect } from 'vitest'
import { catchError } from './error'

describe('catchError', () => {
  it('extracts a string message from response.data.message', () => {
    const error = { response: { data: { message: 'User not found' } } }
    expect(catchError(error)).toBe('User not found')
  })

  it('extracts the first element from a string array message', () => {
    const error = { response: { data: { message: ['Email is required', 'Password is required'] } } }
    expect(catchError(error)).toBe('Email is required')
  })

  it('returns generic message when response.data.message is missing', () => {
    const error = { message: 'Network Error' }
    expect(catchError(error)).toBe('Network Error')
  })

  it('returns empty string when both message sources are missing', () => {
    expect(catchError({})).toBe('')
  })

  it('returns empty string for null or undefined', () => {
    expect(catchError(null)).toBe('')
    expect(catchError(undefined)).toBe('')
  })
})
