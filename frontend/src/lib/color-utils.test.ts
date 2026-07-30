import { describe, it, expect } from 'vitest'
import { isValidHex, createThrottle, applyAlphaToHex } from './color-utils'

describe('isValidHex', () => {
  it('returns true for a valid 6-character hex', () => {
    expect(isValidHex('#FF0000')).toBe(true)
    expect(isValidHex('#abcdef')).toBe(true)
    expect(isValidHex('#123456')).toBe(true)
  })

  it('returns true for a valid 3-character hex', () => {
    expect(isValidHex('#FFF')).toBe(false)
    expect(isValidHex('#abc')).toBe(false)
  })

  it('returns false when missing #', () => {
    expect(isValidHex('FF0000')).toBe(false)
  })

  it('returns false for non-hex characters', () => {
    expect(isValidHex('#GGGGGG')).toBe(false)
  })

  it('returns false for wrong length', () => {
    expect(isValidHex('#FFF0000')).toBe(false)
    expect(isValidHex('#FFF0')).toBe(false)
  })
})

describe('createThrottle', () => {
  it('invokes the function immediately on first call', () => {
    let count = 0
    const fn = () => count++
    const throttled = createThrottle(fn, 100)
    throttled()
    expect(count).toBe(1)
  })

  it('ignores subsequent calls within the delay window', () => {
    let count = 0
    const fn = () => count++
    const throttled = createThrottle(fn, 100)
    throttled()
    throttled()
    throttled()
    expect(count).toBe(1)
  })

  it('allows a new call after the delay expires', async () => {
    let count = 0
    const fn = () => count++
    const throttled = createThrottle(fn, 50)
    throttled()
    expect(count).toBe(1)
    throttled()
    expect(count).toBe(1)
    await new Promise(r => setTimeout(r, 70))
    throttled()
    expect(count).toBe(2)
  })

  it('passes arguments to the original function', () => {
    let result = ''
    const fn = (a: string) => { result = a }
    const throttled = createThrottle(fn, 100)
    throttled('hello')
    expect(result).toBe('hello')
  })
})

describe('applyAlphaToHex', () => {
  it('appends correct alpha channel for 6-character hex', () => {
    expect(applyAlphaToHex('#FF0000', 0.5)).toBe('#FF000080')
  })

  it('expands 3-character hex and appends alpha', () => {
    expect(applyAlphaToHex('#F00', 0.5)).toBe('#FF000080')
  })

  it('returns original hex when input is invalid', () => {
    expect(applyAlphaToHex('invalid', 0.5)).toBe('invalid')
  })

  it('handles full opacity', () => {
    expect(applyAlphaToHex('#00FF00', 1)).toBe('#00FF00FF')
  })

  it('handles zero opacity', () => {
    expect(applyAlphaToHex('#0000FF', 0)).toBe('#0000FF00')
  })
})
