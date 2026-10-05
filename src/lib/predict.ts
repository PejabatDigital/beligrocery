import { addDays } from './dates'
import type { ISODate } from './types'

// Deterministic, explainable predictions. No AI: every suggestion carries its reason.

export const PREDICTION_THRESHOLD = 6

export type PredictLine = {
  item_id: string
  quantity: number | null
  unit: string | null
  amount_rm: number | null
}

export type PredictOrder = {
  order_date: ISODate
  items: PredictLine[]
}

export type Suggested = Pick<PredictLine, 'quantity' | 'unit' | 'amount_rm'>

export type ItemStats = {
  item_id: string
  /** Number of orders the item appears in. */
  appearances: number
  /** Median number of orders between appearances; null if seen only once. */
  interval: number | null
  lastDate: ISODate
  /** Orders from the last appearance to the upcoming one: 1 means "it was in the last order". */
  ordersSinceLast: number
  due: boolean
  /** For items not due: orders after the upcoming one until it's due. 0 when due. */
  ordersUntilDue: number
  suggested: Suggested
  /** "every order", "every 4 weeks", or "ordered once" */
  frequency: string
  /** As shown on Draft next order: "every order", "every 4 weeks · due now", "every 8 weeks · in 4 weeks" */
  reason: string
  /** Position for list ordering: most recent order first, then line order within it. */
  sortKey: number
}

export type Prediction = {
  ready: boolean
  ordersLogged: number
  nextOrderDate: ISODate | null
  due: ItemStats[]
  notDue: ItemStats[]
}

export function median(values: number[]): number {
  if (values.length === 0) throw new Error('median of empty list')
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/** "week", "4 weeks", "month", "2 months" for a span of days. */
export function formatSpan(days: number): string {
  if (days >= 28 && days % 30 === 0) {
    const months = days / 30
    return months === 1 ? 'month' : `${months} months`
  }
  const weeks = Math.max(1, Math.round(days / 7))
  return weeks === 1 ? 'week' : `${weeks} weeks`
}

export function formatFrequency(interval: number | null, cadenceDays: number): string {
  if (interval == null) return 'ordered once'
  if (interval === 1) return 'every order'
  return `every ${formatSpan(interval * cadenceDays)}`
}

function suggestedQuantity(lines: { line: PredictLine; index: number }[]): Suggested {
  const counts = new Map<string, { count: number; last: number; line: PredictLine }>()
  for (const { line, index } of lines) {
    const key = `${line.quantity}|${line.unit ?? ''}|${line.amount_rm}`
    const entry = counts.get(key)
    if (entry) {
      entry.count++
      entry.last = index
    } else {
      counts.set(key, { count: 1, last: index, line })
    }
  }
  // Most common; ties go to the most recently used.
  const best = [...counts.values()].sort((a, b) => b.count - a.count || b.last - a.last)[0]
  return { quantity: best.line.quantity, unit: best.line.unit, amount_rm: best.line.amount_rm }
}

/**
 * Per-item statistics across all orders.
 * `orders` must be sorted oldest first.
 */
export function itemStats(orders: PredictOrder[], cadenceDays: number): Map<string, ItemStats> {
  const n = orders.length
  const seen = new Map<string, { indices: number[]; lines: { line: PredictLine; index: number }[]; position: number }>()

  orders.forEach((order, index) => {
    order.items.forEach((line, position) => {
      const entry = seen.get(line.item_id) ?? { indices: [], lines: [], position }
      // Count an item once per order even if it appears on two lines.
      if (entry.indices.at(-1) !== index) entry.indices.push(index)
      entry.lines.push({ line, index })
      entry.position = position
      seen.set(line.item_id, entry)
    })
  })

  const stats = new Map<string, ItemStats>()
  for (const [item_id, { indices, lines, position }] of seen) {
    const gaps = indices.slice(1).map((v, i) => v - indices[i])
    const interval = gaps.length ? Math.max(1, Math.round(median(gaps))) : null
    const lastIndex = indices[indices.length - 1]
    const ordersSinceLast = n - lastIndex
    const due = interval != null && ordersSinceLast >= interval
    const ordersUntilDue = interval == null || due ? 0 : interval - ordersSinceLast
    const frequency = formatFrequency(interval, cadenceDays)

    let reason = frequency
    if (interval != null && interval > 1) {
      reason += due ? ' · due now' : ` · in ${formatSpan(ordersUntilDue * cadenceDays)}`
    }

    stats.set(item_id, {
      item_id,
      appearances: indices.length,
      interval,
      lastDate: orders[lastIndex].order_date,
      ordersSinceLast,
      due,
      ordersUntilDue,
      suggested: suggestedQuantity(lines),
      frequency,
      reason,
      sortKey: lastIndex * 1000 - position,
    })
  }
  return stats
}

/** Next order date: last order + cadence. */
export function nextOrderDate(orders: PredictOrder[], cadenceDays: number): ISODate | null {
  const last = orders.at(-1)
  return last ? addDays(last.order_date, cadenceDays) : null
}

/** The date an item is next expected, given the upcoming order date. */
export function itemDueDate(stats: ItemStats, upcoming: ISODate, cadenceDays: number): ISODate | null {
  if (stats.interval == null) return null
  return addDays(upcoming, stats.ordersUntilDue * cadenceDays)
}

/**
 * The draft for the next order. Below the threshold it's not ready and both lists are empty.
 * `orders` must be sorted oldest first.
 */
export function predict(orders: PredictOrder[], cadenceDays: number): Prediction {
  const ordersLogged = orders.length
  const ready = ordersLogged >= PREDICTION_THRESHOLD
  const base = { ready, ordersLogged, nextOrderDate: nextOrderDate(orders, cadenceDays) }
  if (!ready) return { ...base, due: [], notDue: [] }

  const all = [...itemStats(orders, cadenceDays).values()].sort((a, b) => b.sortKey - a.sortKey)
  // Not due: items with a rhythm first, soonest first; one-offs last.
  const notDue = all
    .filter((s) => !s.due)
    .sort((a, b) => (a.interval == null ? 1 : 0) - (b.interval == null ? 1 : 0) || a.ordersUntilDue - b.ordersUntilDue)
  return { ...base, due: all.filter((s) => s.due), notDue }
}
