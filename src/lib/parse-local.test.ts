import { describe, expect, it } from 'vitest'
import { FIXTURE_ORDER_TEXT } from './__fixtures__/orders'
import { findDate, parseItemLine, parseLocal } from './parse-local'
import type { CatalogueEntry } from './types'

const TODAY = '2026-10-03'

describe('findDate', () => {
  it('reads Malaysian date formats', () => {
    expect(findDate('3 Oct 2026', TODAY)).toBe('2026-10-03')
    expect(findDate('3/10/26', TODAY)).toBe('2026-10-03')
    expect(findDate('03-10-2026', TODAY)).toBe('2026-10-03')
    expect(findDate('3 Okt', TODAY)).toBe('2026-10-03')
    expect(findDate('12 Ogos', TODAY)).toBe('2026-08-12')
  })

  it('puts a yearless date in the past year when it would be far in the future', () => {
    expect(findDate('20 Dis', TODAY)).toBe('2025-12-20')
  })

  it('ignores lines without dates', () => {
    expect(findDate('Ayam × 2 ekor', TODAY)).toBeNull()
  })
})

describe('parseItemLine', () => {
  it.each([
    ['Ayam × 2 ekor', { name: 'Ayam', quantity: 2, unit: 'ekor', amount_rm: null }],
    ['Ayam × 2ekor', { name: 'Ayam', quantity: 2, unit: 'ekor', amount_rm: null }],
    ['milo x 1', { name: 'milo', quantity: 1, unit: null, amount_rm: null }],
    ['milo x1', { name: 'milo', quantity: 1, unit: null, amount_rm: null }],
    ['Ayam 2 ekor', { name: 'Ayam', quantity: 2, unit: 'ekor', amount_rm: null }],
    ['2 ekor ayam', { name: 'ayam', quantity: 2, unit: 'ekor', amount_rm: null }],
    ['Fish (any type) × 1 kg', { name: 'Fish (any type)', quantity: 1, unit: 'kg', amount_rm: null }],
    ['Cili padi × RM5', { name: 'Cili padi', quantity: null, unit: null, amount_rm: 5 }],
    ['- Gardenia × 1 pek', { name: 'Gardenia', quantity: 1, unit: 'pek', amount_rm: null }],
    ['Bawang', { name: 'Bawang', quantity: null, unit: null, amount_rm: null }],
  ])('%s', (line, expected) => {
    expect(parseItemLine(line)).toEqual(expected)
  })

  it("doesn't split names that contain an x", () => {
    expect(parseItemLine('Max x 2')?.name).toBe('Max')
  })
})

describe('parseLocal', () => {
  it('reads the fixture order', () => {
    const { orders, warnings } = parseLocal(FIXTURE_ORDER_TEXT, [], TODAY)
    expect(warnings).toEqual([])
    expect(orders).toHaveLength(1)
    const [order] = orders
    expect(order.order_date).toBe('2026-10-03')
    expect(order.total_rm).toBe(186.4)
    expect(order.items).toHaveLength(16)
    expect(order.items[0]).toMatchObject({ raw_line: 'Ayam × 2 ekor', name: 'Ayam', quantity: 2, unit: 'ekor' })
    expect(order.items.find((i) => i.name === 'Cili padi')).toMatchObject({ quantity: null, amount_rm: 5 })
    // A new user has an empty catalogue: everything needs a category.
    expect(order.items.every((i) => i.confidence === 'low' && i.category === null)).toBe(true)
  })

  it('matches against the catalogue', () => {
    const catalogue: CatalogueEntry[] = [
      { id: 't', canonical_name: 'Telor', aliases: [], category: 'dairy' },
      { id: 'm', canonical_name: 'Milo', aliases: ['milo medium'], category: 'pantry' },
    ]
    const { orders } = parseLocal('TELOR × 1 tray\ntelur × 1 tray\nMilo Medium x 1\nBawang', catalogue, TODAY)
    const [exact, typo, alias, unknown] = orders[0].items
    expect(exact).toMatchObject({ matched_item_id: 't', confidence: 'high', category: 'dairy' })
    expect(typo).toMatchObject({ matched_item_id: 't', confidence: 'low' })
    expect(alias).toMatchObject({ matched_item_id: 'm', confidence: 'high' })
    expect(unknown).toMatchObject({ matched_item_id: null, confidence: 'low', category: null })
  })

  it('warns when the date and total are missing', () => {
    const { orders, warnings } = parseLocal('Ayam × 2 ekor', [], TODAY)
    expect(orders[0].order_date).toBeNull()
    expect(warnings).toEqual(['No date found', 'No total found'])
  })

  it('splits a bulk paste into orders by date', () => {
    const text = '19 Sep 2026 · RM 170\nAyam × 2 ekor\n\n3 Oct 2026 · RM 186.40\nAyam × 2 ekor\nmilo x 1'
    const { orders } = parseLocal(text, [], TODAY)
    expect(orders.map((o) => [o.order_date, o.total_rm, o.items.length])).toEqual([
      ['2026-09-19', 170, 1],
      ['2026-10-03', 186.4, 2],
    ])
  })

  it('reads a separate total line', () => {
    const { orders } = parseLocal('3/10/26\nAyam × 2 ekor\nTotal: RM186.40', [], TODAY)
    expect(orders[0]).toMatchObject({ order_date: '2026-10-03', total_rm: 186.4 })
    expect(orders[0].items).toHaveLength(1)
  })
})
