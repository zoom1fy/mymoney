import { describe, it, expect } from 'vitest'
import { formatCurrency } from './format'

describe('formatCurrency', () => {
  it('formats an integer with ru-RU locale (non-breaking space)', () => {
    expect(formatCurrency(1000)).toBe('1\u00a0000')
  })

  it('formats a decimal number', () => {
    expect(formatCurrency(1234.56)).toBe('1\u00a0234,56')
  })

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('0')
  })

  it('handles negative numbers', () => {
    expect(formatCurrency(-500)).toBe('-500')
  })

  it('handles large numbers', () => {
    expect(formatCurrency(1000000)).toBe('1\u00a0000\u00a0000')
  })
})
