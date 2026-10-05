import { useMemo, useState } from 'react'
import { useAppData } from '../../app/useAppData'
import { ItemRow } from '../../components/ItemRow'
import { OrderRow } from '../../components/OrderRow'
import { Screen } from '../../components/layout/Screen'
import { SectionLabel } from '../../components/layout/SectionLabel'
import { TabBar } from '../../components/layout/TabBar'
import { inputClass } from '../../components/TextField'
import { CATEGORY_LABELS } from '../../lib/categories'
import { formatMonthYear, monthKey } from '../../lib/dates'
import { plural } from '../../lib/format'
import { normalizeName } from '../../lib/match'
import type { Order } from '../../lib/types'

// Figma: History › Orders (7:92)
export function History() {
  const { orders, items, stats } = useAppData()
  const [query, setQuery] = useState('')
  const q = normalizeName(query)

  // The most-ordered item makes a real example for the search placeholder.
  const example = useMemo(() => {
    const top = [...stats.values()].sort((a, b) => b.appearances - a.appearances)[0]
    return top ? items.find((i) => i.id === top.item_id)?.canonical_name : undefined
  }, [stats, items])

  const matchingItems = useMemo(
    () =>
      q
        ? items.filter((i) => [i.canonical_name, ...i.aliases].some((n) => normalizeName(n).includes(q)))
        : [],
    [items, q],
  )

  const months = useMemo(() => {
    const ids = new Set(matchingItems.map((i) => i.id))
    const visible = [...orders].reverse().filter((o) => !q || o.items.some((l) => ids.has(l.item_id)))
    const groups: { key: string; label: string; orders: Order[] }[] = []
    for (const o of visible) {
      const key = monthKey(o.order_date)
      if (groups.at(-1)?.key !== key) groups.push({ key, label: formatMonthYear(o.order_date), orders: [] })
      groups.at(-1)!.orders.push(o)
    }
    return groups
  }, [orders, matchingItems, q])

  return (
    <Screen footer={<TabBar />}>
      <h1 className="type-title text-text-primary">History</h1>
      {orders.length > 0 && (
        <input
          type="search"
          aria-label="Search items"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={example ? `Search items, e.g. ${example}` : 'Search items'}
          className={`${inputClass} !py-md`}
        />
      )}

      {matchingItems.length > 0 && (
        <>
          <SectionLabel>Items · {matchingItems.length}</SectionLabel>
          {matchingItems.map((i) => (
            <ItemRow
              key={i.id}
              to={`/history/items/${i.id}`}
              name={i.canonical_name}
              meta={`${CATEGORY_LABELS[i.category]} · ${plural(stats.get(i.id)?.appearances ?? 0, 'order')}`}
            />
          ))}
        </>
      )}

      {months.map((m) => (
        <section key={m.key} className="flex flex-col gap-lg">
          <SectionLabel>{m.label}</SectionLabel>
          {m.orders.map((o) => (
            <OrderRow key={o.id} order={o} />
          ))}
        </section>
      ))}

      {orders.length === 0 && <p className="type-body text-text-secondary">No orders yet. Orders you log show up here.</p>}
      {orders.length > 0 && q && months.length === 0 && (
        <p className="type-body text-text-secondary">No orders with “{query.trim()}”.</p>
      )}

      {!q && (
        <section className="flex flex-col gap-lg">
          <SectionLabel>This device</SectionLabel>
          <ItemRow to="/settings" name="Backup and settings" meta="Your orders are saved on this device only" />
        </section>
      )}
    </Screen>
  )
}
