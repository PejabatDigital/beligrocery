import { describe, expect, it } from 'vitest'
import { formatDate, formatMonthYear, formatUntil, formatWeekdayDate } from './dates'
import { formatQuantity, formatRM, formatRMDelta, formatWhatsAppLine } from './format'

describe('currency', () => {
  it('formats RM per the conventions', () => {
    expect(formatRM(186.4)).toBe('RM 186.40')
    expect(formatRM(372, { whole: true })).toBe('RM 372')
    expect(formatRMDelta(14.3)).toBe('+RM 14')
    expect(formatRMDelta(-6)).toBe('−RM 6')
  })
})

describe('dates', () => {
  it('formats dates per the conventions', () => {
    expect(formatDate('2026-10-03')).toBe('3 Oct 2026')
    expect(formatDate('2026-09-26')).toBe('26 Sep 2026')
    expect(formatWeekdayDate('2026-10-17')).toBe('Sat, 17 Oct')
    expect(formatMonthYear('2026-10-03')).toBe('October 2026')
    expect(formatUntil('2026-10-17', '2026-10-14')).toBe('In 3 days')
    expect(formatUntil('2026-10-12', '2026-10-14')).toBe('2 days late')
  })
})

describe('WhatsApp lines', () => {
  it('matches the copy format', () => {
    expect(formatWhatsAppLine('Ayam', { quantity: 2, unit: 'ekor', amount_rm: null })).toBe('Ayam × 2 ekor')
    expect(formatWhatsAppLine('Milo', { quantity: 1, unit: null, amount_rm: null })).toBe('Milo × 1')
    expect(formatWhatsAppLine('Cili padi', { quantity: null, unit: null, amount_rm: 5 })).toBe('Cili padi × RM5')
    expect(formatQuantity({ quantity: 1.5, unit: 'kg', amount_rm: null })).toBe('1.5 kg')
  })
})
