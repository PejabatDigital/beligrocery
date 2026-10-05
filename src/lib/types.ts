import type { Category } from './categories'

/** A plain calendar date, 'YYYY-MM-DD', in Asia/Kuala_Lumpur. */
export type ISODate = string

export type Profile = {
  id: string
  user_id: string
  shopping_for: string
  cadence_days: number
  created_at: string
}

export type Item = {
  id: string
  user_id: string
  canonical_name: string
  category: Category
  aliases: string[]
  created_at: string
}

export type OrderItem = {
  id: string
  order_id: string
  item_id: string
  /** Null for money-only lines like "Cili padi × RM5". */
  quantity: number | null
  unit: string | null
  amount_rm: number | null
  raw_line: string
}

export type Order = {
  id: string
  user_id: string
  order_date: ISODate
  total_rm: number | null
  raw_text: string
  created_at: string
  items: OrderItem[]
}

/** One line on Review order, ready to save. */
export type DraftLine = {
  raw_line: string
  /** As the user wrote it. Becomes canonical_name when this creates a new item. */
  name: string
  quantity: number | null
  unit: string | null
  amount_rm: number | null
  /** Existing catalogue item, or null to create a new one. */
  item_id: string | null
  /** Required when item_id is null. */
  category: Category | null
}

export type NewOrder = {
  order_date: ISODate
  total_rm: number | null
  raw_text: string
  lines: DraftLine[]
}

export type CatalogueEntry = Pick<Item, 'id' | 'canonical_name' | 'aliases' | 'category'>
