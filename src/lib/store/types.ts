import type { Item, NewOrder, Order, Profile } from '../types'

export type Session = { userId: string; email: string | null }

export type Snapshot = {
  profile: Profile | null
  items: Item[]
  /** Oldest first, each with its lines. */
  orders: Order[]
}

/** Everything the app needs from the backend. Implemented by Supabase and, in dev, by local storage. */
export interface Store {
  mode: 'supabase' | 'local'
  getSession(): Promise<Session | null>
  onSessionChange(callback: (session: Session | null) => void): () => void
  sendMagicLink(email: string): Promise<void>
  signOut(): Promise<void>
  /** Bearer token for /api calls, or null in local mode. */
  getAccessToken(): Promise<string | null>
  load(): Promise<Snapshot>
  saveProfile(input: { shopping_for: string; cadence_days: number }): Promise<void>
  /** Saves the order, creating items and aliases as needed. Returns the new order id. */
  saveOrder(order: NewOrder): Promise<string>
}

export function sortOrders(orders: Order[]): Order[] {
  return [...orders].sort(
    (a, b) => a.order_date.localeCompare(b.order_date) || a.created_at.localeCompare(b.created_at),
  )
}
