import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useAppData } from '../../app/useAppData'
import { Button } from '../../components/Button'
import { CategoryChip } from '../../components/CategoryChip'
import { ItemRow } from '../../components/ItemRow'
import { StatCard } from '../../components/StatCard'
import { Screen } from '../../components/layout/Screen'
import { TopBar } from '../../components/layout/TopBar'
import { useToast } from '../../components/Toast'
import { CATEGORIES, CATEGORY_LABELS, type Category } from '../../lib/categories'
import { copyText } from '../../lib/clipboard'
import { formatDate } from '../../lib/dates'
import { formatQuantity, formatRM, formatRMDelta, formatTrailing, formatWhatsAppLine, plural } from '../../lib/format'

// Figma: History › Order detail (7:124)
export function OrderDetail() {
  const { id } = useParams()
  const { orders, itemsById } = useAppData()
  const [filter, setFilter] = useState<Category | null>(null)
  const { show, toast } = useToast()

  const index = orders.findIndex((o) => o.id === id)
  if (index === -1) return <Navigate to="/history" replace />
  const order = orders[index]
  const previous = orders[index - 1]

  const lines = order.items.map((l) => ({ line: l, item: itemsById.get(l.item_id)! }))
  const present = CATEGORIES.filter((c) => lines.some((l) => l.item.category === c))
  const visible = filter ? lines.filter((l) => l.item.category === filter) : lines

  // "vs last": change in total, and what's new compared with the previous order.
  let vsValue = '—'
  let vsNote = 'first order'
  if (previous) {
    const prevIds = new Set(previous.items.map((l) => l.item_id))
    const added = lines.filter((l) => !prevIds.has(l.line.item_id))
    vsValue = order.total_rm != null && previous.total_rm != null ? formatRMDelta(order.total_rm - previous.total_rm) : '—'
    vsNote =
      added.length === 0
        ? 'same items'
        : added.length === 1
          ? `${added[0].item.canonical_name} added`
          : `${plural(added.length, 'item')} added`
  }

  async function copyList() {
    const text = lines.map(({ line, item }) => formatWhatsAppLine(item.canonical_name, line)).join('\n')
    show((await copyText(text)) ? 'Copied' : "Couldn't copy")
  }

  return (
    <Screen
      footer={
        <Button variant="secondary" fullWidth onClick={copyList}>
          Copy as list
        </Button>
      }
    >
      <TopBar subtitle="Order" title={formatDate(order.order_date)} />
      <div className="flex gap-md">
        <StatCard
          label="Total"
          value={order.total_rm != null ? formatRM(order.total_rm, { whole: true }) : '—'}
          note={plural(order.items.length, 'item')}
        />
        <StatCard label="Vs last" value={vsValue} note={vsNote} />
      </div>
      {present.length > 1 && (
        <div className="flex flex-wrap gap-[6px]" role="group" aria-label="Filter by group">
          {present.map((c) => (
            <CategoryChip
              key={c}
              category={c}
              selected={filter == null ? undefined : filter === c}
              onClick={() => setFilter(filter === c ? null : c)}
            />
          ))}
        </div>
      )}
      <div className="flex flex-col gap-lg">
        {visible.map(({ line, item }) => (
          <ItemRow
            key={line.id}
            to={`/history/items/${item.id}`}
            name={item.canonical_name}
            meta={[formatQuantity(line), CATEGORY_LABELS[item.category]].filter(Boolean).join(' · ')}
            trailing={formatTrailing(line)}
          />
        ))}
      </div>
      {toast}
    </Screen>
  )
}
