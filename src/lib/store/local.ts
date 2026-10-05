import { normalizeName } from '../match'
import type { Item, Order, OrderItem, Profile } from '../types'
import { sortOrders, type Snapshot, type Store } from './types'

// Dev-only stand-in for Supabase, so the app runs before any accounts are set up.
// Data lives in this browser's localStorage. Never used in production builds.

const KEY = 'beli-grocery:local-db:v1'
const USER_ID = 'local-user'

type Db = { signedIn: boolean; profile: Profile | null; items: Item[]; orders: Omit<Order, 'items'>[]; lines: OrderItem[] }

const empty = (): Db => ({ signedIn: false, profile: null, items: [], orders: [], lines: [] })

function read(): Db {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...empty(), ...JSON.parse(raw) } : empty()
  } catch {
    return empty()
  }
}

function write(db: Db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    // Storage full or blocked: nothing more we can do in local mode.
  }
}

const now = () => new Date().toISOString()
const listeners = new Set<(s: { userId: string; email: null } | null) => void>()
const session = (db: Db) => (db.signedIn ? { userId: USER_ID, email: null } : null)

export function createLocalStore(): Store {
  return {
    mode: 'local',

    async getSession() {
      return session(read())
    },

    onSessionChange(callback) {
      listeners.add(callback)
      return () => listeners.delete(callback)
    },

    // No email in local mode: "sending" the link signs straight in.
    async sendMagicLink() {
      const db = read()
      db.signedIn = true
      write(db)
      listeners.forEach((l) => l(session(db)))
    },

    async signOut() {
      const db = read()
      db.signedIn = false
      write(db)
      listeners.forEach((l) => l(null))
    },

    async getAccessToken() {
      return null
    },

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
      db.profile = db.profile
        ? { ...db.profile, ...input }
        : { id: crypto.randomUUID(), user_id: USER_ID, created_at: now(), ...input }
      write(db)
    },

    // Mirrors public.save_order in the Supabase migration.
    async saveOrder(order) {
      if (order.lines.length === 0) throw new Error('An order needs at least one item')
      const db = read()
      const orderId = crypto.randomUUID()
      db.orders.push({
        id: orderId,
        user_id: USER_ID,
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
          item = { id: crypto.randomUUID(), user_id: USER_ID, canonical_name: name, category: line.category, aliases: [], created_at: now() }
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
  }
}
