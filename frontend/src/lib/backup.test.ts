import { describe, expect, it } from 'vitest'

import { buildBackupFileName, formatFileSize } from './backup'

describe('buildBackupFileName', () => {
  it('formats the local date and time with zero padding', () => {
    const date = new Date(2026, 0, 5, 9, 7)

    expect(buildBackupFileName(date)).toBe('mymoney-backup-2026-01-05-09-07.db')
  })

  it('keeps the full year and minutes', () => {
    const date = new Date(2026, 10, 24, 18, 30)

    expect(buildBackupFileName(date)).toBe('mymoney-backup-2026-11-24-18-30.db')
  })
})

describe('formatFileSize', () => {
  it('shows bytes below one kilobyte', () => {
    expect(formatFileSize(512)).toBe('512 Б')
  })

  it('shows kilobytes with one decimal', () => {
    expect(formatFileSize(2048)).toBe('2,0 КБ')
  })

  it('shows megabytes with one decimal', () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5,0 МБ')
  })
})
