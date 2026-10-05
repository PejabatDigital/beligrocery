import { Navigate, useParams } from 'react-router-dom'
import { useAppData } from '../../app/useAppData'
import { ButtonLink } from '../../components/Button'
import { CategoryChip } from '../../components/CategoryChip'
import { StatCard } from '../../components/StatCard'
import { Screen } from '../../components/layout/Screen'
import { SectionLabel } from '../../components/layout/SectionLabel'
import { TopBar } from '../../components/layout/TopBar'
import { formatAgo, formatDayMonth, formatMonthYearShort, formatWeekdayDate } from '../../lib/dates'
import { itemDueDate } from '../../lib/predict'

const TIMELINE_MAX = 26

/** "4 wks", "2 mo": the item's rhythm as a short stat value. */
function shortSpan(days: number): string {
  if (days >= 28 && days % 30 === 0) return `${days / 30} mo`
  const weeks = Math.max(1, Math.round(days / 7))
  return `${weeks} wk${weeks === 1 ? '' : 's'}`
}

// Figma: History › Item detail (7:175). Price tracking is out of scope for v1, so "Typical price" is left out.
export function ItemDetail() {
  const { id } = useParams()
  const { itemsById, stats, orders, prediction, cadence } = useAppData()
  const item = id ? itemsById.get(id) : undefined
  const s = id ? stats.get(id) : undefined
  if (!item || !s) return <Navigate to="/history" replace />

  const recent = orders.slice(-TIMELINE_MAX)
  const dueDate = prediction.ready && prediction.nextOrderDate ? itemDueDate(s, prediction.nextOrderDate, cadence) : null

  return (
    <Screen
      footer={
        prediction.ready && (
          <ButtonLink to={`/draft?add=${item.id}`} variant="secondary" fullWidth>
            Add to next order
          </ButtonLink>
        )
      }
    >
      <TopBar subtitle="Item" title={item.canonical_name} />
      <div>
        <CategoryChip category={item.category} />
      </div>
      <div className="flex gap-md">
        <StatCard
          label="Ordered"
          value={s.interval == null ? 'Once' : shortSpan(s.interval * cadence)}
          note={`${s.appearances} of ${orders.length} orders`}
        />
        <StatCard
          label="Last ordered"
          value={formatDayMonth(s.lastDate)}
          note={dueDate ? `due ${formatWeekdayDate(dueDate)}` : formatAgo(s.lastDate)}
        />
      </div>
      <section className="flex flex-col gap-[10px] rounded-lg border border-border-default bg-bg-surface p-lg">
        <SectionLabel>Last {recent.length === 1 ? 'order' : `${recent.length} orders`}</SectionLabel>
        <ol className="flex gap-[3px]" aria-label={`Ordered in ${s.appearances} of the last ${recent.length} orders`}>
          {recent.map((o) => {
            const has = o.items.some((l) => l.item_id === item.id)
            return (
              <li
                key={o.id}
                title={`${formatDayMonth(o.order_date)}: ${has ? 'ordered' : 'not ordered'}`}
                className={`h-7 max-w-6 min-w-0 flex-1 rounded-[3px] ${has ? 'bg-bg-brand' : 'bg-bg-subtle'}`}
              />
            )
          })}
        </ol>
        <p className="type-caption text-text-secondary">
          {formatMonthYearShort(recent[0].order_date)} → {formatMonthYearShort(recent[recent.length - 1].order_date)}
        </p>
      </section>
    </Screen>
  )
}
