import type { Item, NewOrder, Order, Profile } from '../types'

export type Snapshot = {
  profile: Profile | null
  items: Item[]
  /** Oldest first, each with its lines. */
  orders: Order[]
}

/** Everything the app needs from storage. Async so a different backend could slot in later. */
export interface Store {
  load(): Promise<Snapshot>
  saveProfile(input: { shopping_for: string; cadence_days: number }): Promise<void>
  /** Saves the order, creating items and aliases as needed. Returns the new order id. */
  saveOrder(order: NewOrder): Promise<string>
  /** Removes the order, and any item no other order uses. */
  deleteOrder(id: string): Promise<void>
  /** Everything, as a JSON file's contents. */
  exportBackup(): Promise<string>
  /** Replaces everything with a backup made by exportBackup. Throws if the file isn't one. */
  restoreBackup(json: string): Promise<void>
  eraseAll(): Promise<void>
  /** When the last backup was made, or null if never. */
  lastBackupAt(): string | null
}

export function sortOrders(orders: Order[]): Order[] {
  return [...orders].sort(
    (a, b) => a.order_date.localeCompare(b.order_date) || a.created_at.localeCompare(b.created_at),
  )
}
