import { z } from 'zod'
import { CATEGORIES } from '../categories'
import { normalizeName } from '../match'
import type { Item, Order, OrderItem, Profile } from '../types'
import { sortOrders, type Snapshot, type Store } from './types'

// All data lives in this browser's localStorage. There's no server: back up with exportBackup.

const KEY = 'beli-grocery:local-db:v1'
const BACKUP_KEY = 'beli-grocery:last-backup'

const profileSchema = z.object({
  id: z.string(),
  shopping_for: z.string(),
  cadence_days: z.number().int().positive(),
  created_at: z.string(),
})
const itemSchema = z.object({
  id: z.string(),
  canonical_name: z.string(),
  category: z.enum(CATEGORIES),
  aliases: z.array(z.string()),
  created_at: z.string(),
})
const orderSchema = z.object({
  id: z.string(),
  order_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  total_rm: z.number().nullable(),
  raw_text: z.string(),
  created_at: z.string(),
})
const lineSchema = z.object({
  id: z.string(),
  order_id: z.string(),
  item_id: z.string(),
  quantity: z.number().nullable(),
  unit: z.string().nullable(),
  amount_rm: z.number().nullable(),
  raw_line: z.string(),
})
const dbSchema = z.object({
  profile: profileSchema.nullable(),
  items: z.array(itemSchema),
  orders: z.array(orderSchema),
  lines: z.array(lineSchema),
})
const backupSchema = z.object({
  app: z.literal('beli-grocery'),
  version: z.literal(1),
  exported_at: z.string(),
  data: dbSchema,
})

type Db = { profile: Profile | null; items: Item[]; orders: Omit<Order, 'items'>[]; lines: OrderItem[] }

const empty = (): Db => ({ profile: null, items: [], orders: [], lines: [] })

function read(): Db {
  const raw = localStorage.getItem(KEY)
  if (!raw) return empty()
  // Parsing strips fields older versions stored (user_id, signedIn).
  const parsed = dbSchema.safeParse(JSON.parse(raw))
  if (!parsed.success) throw new Error('Your saved data looks damaged. Restore a backup from Settings.')
  return parsed.data
}

function write(db: Db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    throw new Error("Couldn't save on this device. The browser may be out of space or blocking storage.")
  }
}

const now = () => new Date().toISOString()

export function createLocalStore(): Store {
  return {
    async load(): Promise<Snapshot> {
      const db = read()
      return {
        profile: db.profile,
        items: db.items,
        orders: sortOrders(db.orders.map((o) => ({ ...o, items: db.lines.filter((l) => l.order_id === o.id) }))),
      }
    },

    async saveProfile(input) {
      const db = read()
      db.profile = db.profile ? { ...db.profile, ...input } : { id: crypto.randomUUID(), created_at: now(), ...input }
      write(db)
    },

    async saveOrder(order) {
      if (order.lines.length === 0) throw new Error('An order needs at least one item')
      const db = read()
      const orderId = crypto.randomUUID()
      db.orders.push({
        id: orderId,
        order_date: order.order_date,
        total_rm: order.total_rm,
        raw_text: order.raw_text,
        created_at: now(),
      })

      for (const line of order.lines) {
        const name = line.name.trim()
        let item =
          (line.item_id && db.items.find((i) => i.id === line.item_id)) ||
          db.items.find((i) => i.canonical_name.toLowerCase() === name.toLowerCase())
        if (!item) {
          if (!line.category) throw new Error(`Pick a group for ${name}`)
          item = { id: crypto.randomUUID(), canonical_name: name, category: line.category, aliases: [], created_at: now() }
          db.items.push(item)
        }
        const n = normalizeName(name)
        if (normalizeName(item.canonical_name) !== n && !item.aliases.some((a) => normalizeName(a) === n)) {
          item.aliases.push(name)
        }
        db.lines.push({
          id: crypto.randomUUID(),
          order_id: orderId,
          item_id: item.id,
          quantity: line.quantity,
          unit: line.unit,
          amount_rm: line.amount_rm,
          raw_line: line.raw_line,
        })
      }
      write(db)
      return orderId
    },

    async deleteOrder(id) {
      const db = read()
      db.orders = db.orders.filter((o) => o.id !== id)
      db.lines = db.lines.filter((l) => l.order_id !== id)
      const used = new Set(db.lines.map((l) => l.item_id))
      db.items = db.items.filter((i) => used.has(i.id))
      write(db)
    },

    async exportBackup() {
      const exported_at = now()
      const json = JSON.stringify({ app: 'beli-grocery', version: 1, exported_at, data: read() }, null, 2)
      try {
        localStorage.setItem(BACKUP_KEY, exported_at)
      } catch {
        // Only affects the "last backup" note.
      }
      return json
    },

    async restoreBackup(json) {
      let parsed
      try {
        parsed = backupSchema.safeParse(JSON.parse(json))
      } catch {
        parsed = null
      }
      if (!parsed?.success) throw new Error("That file isn't a Beli Grocery backup.")
      write(parsed.data.data)
    },

    async eraseAll() {
      localStorage.removeItem(KEY)
      localStorage.removeItem(BACKUP_KEY)
    },

    lastBackupAt() {
      try {
        return localStorage.getItem(BACKUP_KEY)
      } catch {
        return null
      }
    },
  }
}
