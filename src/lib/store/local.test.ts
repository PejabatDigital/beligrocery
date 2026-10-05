import { beforeEach, describe, expect, it } from 'vitest'
import type { NewOrder } from '../types'
import { createLocalStore } from './local'

const memory = new Map<string, string>()
globalThis.localStorage = {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => void memory.set(k, v),
  removeItem: (k: string) => void memory.delete(k),
} as Storage

const order = (date: string, names: string[]): NewOrder => ({
  order_date: date,
  total_rm: 50,
  raw_text: names.join('\n'),
  lines: names.map((name) => ({
    raw_line: name,
    name,
    quantity: 1,
    unit: null,
    amount_rm: null,
    item_id: null,
    category: 'pantry',
  })),
})

describe('local store', () => {
  beforeEach(() => memory.clear())

  it('reuses items across orders and deletes items no order uses', async () => {
    const store = createLocalStore()
    const first = await store.saveOrder(order('2026-10-03', ['Milo', 'Gardenia']))
    await store.saveOrder(order('2026-10-17', ['milo']))
    expect((await store.load()).items.map((i) => i.canonical_name)).toEqual(['Milo', 'Gardenia'])

    await store.deleteOrder(first)
    const after = await store.load()
    expect(after.orders).toHaveLength(1)
    expect(after.items.map((i) => i.canonical_name)).toEqual(['Milo'])
  })

  it('restores exactly what it backed up', async () => {
    const store = createLocalStore()
    await store.saveProfile({ shopping_for: 'Mum', cadence_days: 14 })
    await store.saveOrder(order('2026-10-03', ['Milo']))
    const before = await store.load()
    const backup = await store.exportBackup()
    expect(store.lastBackupAt()).not.toBeNull()

    await store.eraseAll()
    expect((await store.load()).orders).toHaveLength(0)

    await store.restoreBackup(backup)
    expect(await store.load()).toEqual(before)
  })

  it('rejects files that are not backups and keeps existing data', async () => {
    const store = createLocalStore()
    await store.saveOrder(order('2026-10-03', ['Milo']))
    await expect(store.restoreBackup('not json')).rejects.toThrow("isn't a Beli Grocery backup")
    await expect(store.restoreBackup('{"app":"other"}')).rejects.toThrow()
    expect((await store.load()).orders).toHaveLength(1)
  })

  it('reads data saved by the earlier dev-only version', async () => {
    memory.set(
      'beli-grocery:local-db:v1',
      JSON.stringify({
        signedIn: true,
        profile: { id: 'p', user_id: 'local-user', shopping_for: 'Mum', cadence_days: 14, created_at: 'x' },
        items: [],
        orders: [],
        lines: [],
      }),
    )
    expect((await createLocalStore().load()).profile).toEqual({ id: 'p', shopping_for: 'Mum', cadence_days: 14, created_at: 'x' })
  })
})
