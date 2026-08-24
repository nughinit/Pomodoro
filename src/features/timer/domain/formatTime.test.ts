import { describe, expect, it } from 'vitest'
import { formatTime } from './formatTime'

describe('formatTime', () => {
  it('formats the full focus duration as 25:00', () => {
    expect(formatTime(25 * 60 * 1000)).toBe('25:00')
  })

  it('formats zero as 00:00', () => {
    expect(formatTime(0)).toBe('00:00')
  })

  it('pads single-digit minutes and seconds', () => {
    expect(formatTime(65 * 1000)).toBe('01:05')
  })
})
