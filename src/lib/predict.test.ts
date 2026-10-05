import { describe, expect, it } from 'vitest'
import { fortnightlyOrders } from './__fixtures__/orders'
import { formatFrequency, formatSpan, itemDueDate, itemStats, median, predict, type PredictOrder } from './predict'

const CADENCE = 14

describe('median', () => {
  it('handles odd and even lists', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([1, 2, 3, 4])).toBe(2.5)
  })
})

describe('formatSpan / formatFrequency', () => {
  it('speaks in weeks for weekly cadences', () => {
    expect(formatSpan(7)).toBe('week')
    expect(formatSpan(28)).toBe('4 weeks')
    expect(formatFrequency(1, 14)).toBe('every order')
    expect(formatFrequency(2, 14)).toBe('every 4 weeks')
    expect(formatFrequency(null, 14)).toBe('ordered once')
  })

  it('speaks in months for a monthly cadence', () => {
    expect(formatFrequency(2, 30)).toBe('every 2 months')
    expect(formatSpan(30)).toBe('month')
  })
})

describe('predict', () => {
  it('stays in the learning state below 6 orders', () => {
    const p = predict(fortnightlyOrders(5), CADENCE)
    expect(p.ready).toBe(false)
    expect(p.ordersLogged).toBe(5)
    expect(p.due).toEqual([])
    expect(p.notDue).toEqual([])
  })

  it('unlocks at exactly 6 orders', () => {
    expect(predict(fortnightlyOrders(6), CADENCE).ready).toBe(true)
  })

  it('puts every-order items in "Due this round"', () => {
    const p = predict(fortnightlyOrders(), CADENCE)
    const ayam = p.due.find((s) => s.item_id === 'ayam')!
    expect(ayam.interval).toBe(1)
    expect(ayam.reason).toBe('every order')
    expect(ayam.suggested).toEqual({ quantity: 2, unit: 'ekor', amount_rm: null })
  })

  it('marks an every-4-weeks item due when its interval has passed', () => {
    const p = predict(fortnightlyOrders(), CADENCE)
    const milo = p.due.find((s) => s.item_id === 'milo')!
    expect(milo.interval).toBe(2)
    expect(milo.ordersSinceLast).toBe(2)
    expect(milo.reason).toBe('every 4 weeks · due now')
  })

  it('explains when a not-due item will be due', () => {
    const p = predict(fortnightlyOrders(), CADENCE)
    const asam = p.notDue.find((s) => s.item_id === 'asam')!
    expect(asam.interval).toBe(4)
    expect(asam.ordersUntilDue).toBe(2)
    expect(asam.reason).toBe('every 8 weeks · in 4 weeks')
  })

  it('keeps items seen once out of the due list', () => {
    const p = predict(fortnightlyOrders(), CADENCE)
    const sardin = p.notDue.find((s) => s.item_id === 'sardin')!
    expect(sardin.interval).toBeNull()
    expect(sardin.reason).toBe('ordered once')
  })

  it('sets the next order date to the last order plus the cadence', () => {
    const p = predict(fortnightlyOrders(), CADENCE)
    expect(p.nextOrderDate).toBe('2026-10-17')
  })

  it('lists not-due items with a rhythm before one-offs', () => {
    const p = predict(fortnightlyOrders(), CADENCE)
    expect(p.notDue.map((s) => s.item_id)).toEqual(['asam', 'sardin'])
  })

  it('lists due items in the order of the most recent list', () => {
    const p = predict(fortnightlyOrders(), CADENCE)
    expect(p.due.map((s) => s.item_id)).toEqual(['ayam', 'telor', 'gardenia', 'milo'])
  })
})

describe('itemStats', () => {
  it('suggests the most common quantity, breaking ties by most recent', () => {
    const orders: PredictOrder[] = [
      { order_date: '2026-01-01', items: [{ item_id: 'a', quantity: 1, unit: 'kg', amount_rm: null }] },
      { order_date: '2026-01-15', items: [{ item_id: 'a', quantity: 2, unit: 'kg', amount_rm: null }] },
      { order_date: '2026-01-29', items: [{ item_id: 'a', quantity: 2, unit: 'kg', amount_rm: null }] },
      { order_date: '2026-02-12', items: [{ item_id: 'b', quantity: 1, unit: null, amount_rm: null }] },
      { order_date: '2026-02-26', items: [{ item_id: 'b', quantity: 3, unit: null, amount_rm: null }] },
    ]
    const stats = itemStats(orders, 14)
    expect(stats.get('a')!.suggested.quantity).toBe(2)
    expect(stats.get('b')!.suggested.quantity).toBe(3)
  })

  it('suggests money amounts for lines like "Cili padi × RM5"', () => {
    const orders: PredictOrder[] = [1, 2].map((d) => ({
      order_date: `2026-01-0${d}`,
      items: [{ item_id: 'cili', quantity: null, unit: null, amount_rm: 5 }],
    }))
    expect(itemStats(orders, 14).get('cili')!.suggested).toEqual({ quantity: null, unit: null, amount_rm: 5 })
  })

  it('counts an item once per order even if listed twice', () => {
    const orders: PredictOrder[] = [
      {
        order_date: '2026-01-01',
        items: [
          { item_id: 'a', quantity: 1, unit: null, amount_rm: null },
          { item_id: 'a', quantity: 1, unit: null, amount_rm: null },
        ],
      },
      { order_date: '2026-01-15', items: [{ item_id: 'a', quantity: 1, unit: null, amount_rm: null }] },
    ]
    const a = itemStats(orders, 14).get('a')!
    expect(a.appearances).toBe(2)
    expect(a.interval).toBe(1)
  })

  it('gives the date an item is next expected', () => {
    const asam = itemStats(fortnightlyOrders(), CADENCE).get('asam')!
    expect(itemDueDate(asam, '2026-10-17', CADENCE)).toBe('2026-11-14')
  })
})
