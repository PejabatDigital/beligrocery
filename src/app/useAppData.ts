import { useMemo } from 'react'
import { daysBetween, monthKey, todayISO } from '../lib/dates'
import { itemStats, predict } from '../lib/predict'
import type { Store } from '../lib/store'
import type { CatalogueEntry, Item } from '../lib/types'
import { useDataContext } from './DataProvider'

/** Signed-in data plus everything derived from it. Only use under <RequireReady>. */
export function useAppData() {
  const { state, store, refresh } = useDataContext()
  if (state.status !== 'ready' || !store) throw new Error('useAppData before data is ready')
  const { profile, items, orders, session } = state
  const cadence = profile?.cadence_days ?? 14

  const derived = useMemo(() => {
    const itemsById = new Map<string, Item>(items.map((i) => [i.id, i]))
    const catalogue: CatalogueEntry[] = items.map(({ id, canonical_name, aliases, category }) => ({
      id,
      canonical_name,
      aliases,
      category,
    }))
    return {
      itemsById,
      catalogue,
      prediction: predict(orders, cadence),
      stats: itemStats(orders, cadence),
    }
  }, [items, orders, cadence])

  return {
    store: store as Store,
    refresh,
    session,
    profile,
    items,
    orders,
    cadence,
    name: profile?.shopping_for ?? '',
    ...derived,
  }
}

export type AppData = ReturnType<typeof useAppData>

/** "Spent this month": totals of orders in the current Kuala Lumpur month. */
export function spentThisMonth(data: Pick<AppData, 'orders'>, today = todayISO()) {
  const month = monthKey(today)
  const thisMonth = data.orders.filter((o) => monthKey(o.order_date) === month)
  return {
    amount: thisMonth.reduce((sum, o) => sum + (o.total_rm ?? 0), 0),
    count: thisMonth.length,
  }
}

/** Average total over the last `n` orders that have a total. */
export function averagePerOrder(data: Pick<AppData, 'orders'>, n = 6) {
  const withTotals = data.orders.filter((o) => o.total_rm != null).slice(-n)
  if (withTotals.length === 0) return null
  return {
    amount: withTotals.reduce((s, o) => s + (o.total_rm ?? 0), 0) / withTotals.length,
    count: withTotals.length,
  }
}

export function daysSince(date: string, today = todayISO()) {
  return daysBetween(date, today)
}
