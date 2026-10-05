import { Link } from 'react-router-dom'
import { averagePerOrder, spentThisMonth, useAppData, type AppData } from '../../app/useAppData'
import { ButtonLink } from '../../components/Button'
import { ItemRow } from '../../components/ItemRow'
import { OrderRow } from '../../components/OrderRow'
import { ProgressCard } from '../../components/ProgressCard'
import { StatCard } from '../../components/StatCard'
import { Screen } from '../../components/layout/Screen'
import { TabBar } from '../../components/layout/TabBar'
import { formatAgo, formatDayMonth, formatUntil, formatWeekdayDate } from '../../lib/dates'
import { formatRM, formatTrailing, plural, possessive } from '../../lib/format'
import { PREDICTION_THRESHOLD } from '../../lib/predict'

// Figma: Home › Empty (5:9), Learning (5:31), Ready (6+ orders, 5:73)
export function Home() {
  const data = useAppData()
  const n = data.orders.length
  return (
    <Screen footer={<TabBar />}>
      <header className="flex items-center gap-md">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="type-caption text-text-secondary">Shopping for</span>
          <h1 className="truncate type-title text-text-primary">{data.name}</h1>
        </div>
        <ButtonLink to="/log" variant="ghost">
          + Add order
        </ButtonLink>
      </header>
      {n === 0 ? <Empty name={data.name} /> : n < PREDICTION_THRESHOLD ? <Learning data={data} /> : <Ready data={data} />}
    </Screen>
  )
}

function Empty({ name }: { name: string }) {
  const whose = name ? possessive(name) : 'their'
  return (
    <div className="flex flex-1 flex-col justify-center">
    <div className="flex flex-col items-center gap-md rounded-lg border border-border-default bg-bg-surface px-xl pt-[28px] pb-xl text-center">
      <span aria-hidden="true" className="rounded-full bg-bg-brand-subtle px-[22px] py-[14px] type-title text-text-brand">
        +
      </span>
      <h2 className="type-heading text-text-primary">No orders yet</h2>
      <p className="type-body text-text-secondary">Add your first order and the app starts learning {whose} pattern.</p>
      <ButtonLink to="/log" fullWidth>
        Add first order
      </ButtonLink>
    </div>
    </div>
  )
}

function SpentCard({ data }: { data: AppData }) {
  const spent = spentThisMonth(data)
  return (
    <StatCard
      label="Spent this month"
      value={formatRM(spent.amount, { whole: true })}
      note={spent.count ? plural(spent.count, 'order') : 'no orders yet'}
    />
  )
}

function Learning({ data }: { data: AppData }) {
  const n = data.orders.length
  const last = data.orders[n - 1]
  const remaining = PREDICTION_THRESHOLD - n
  return (
    <>
      <ProgressCard
        filled={n}
        total={PREDICTION_THRESHOLD}
        title={`${n} of ${PREDICTION_THRESHOLD} orders logged`}
        body={`Predictions unlock at ${PREDICTION_THRESHOLD}. ${plural(remaining, 'more order')} to go.`}
      />
      <div className="flex gap-md">
        <SpentCard data={data} />
        <StatCard label="Last order" value={formatDayMonth(last.order_date)} note={formatAgo(last.order_date)} />
      </div>
      <h2 className="type-heading text-text-primary">Recent orders</h2>
      <div className="flex flex-col gap-lg">
        {data.orders
          .slice(-3)
          .reverse()
          .map((o) => (
            <OrderRow key={o.id} order={o} />
          ))}
      </div>
    </>
  )
}

function Ready({ data }: { data: AppData }) {
  const { prediction, itemsById } = data
  const next = prediction.nextOrderDate!
  const avg = averagePerOrder(data)
  // Lead with the items that aren't on every list: they're the ones worth a reminder.
  const highlights = [...prediction.due].sort((a, b) => (b.interval ?? 0) - (a.interval ?? 0)).slice(0, 3)

  return (
    <>
      <section className="flex flex-col gap-[6px] rounded-lg bg-bg-brand p-[20px] text-text-on-brand">
        <span className="type-label">Next order</span>
        <p className="type-display">{formatWeekdayDate(next)}</p>
        <p className="type-body">
          {formatUntil(next)} · {plural(prediction.due.length, 'item')} suggested
        </p>
        <ButtonLink to="/draft" variant="secondary" fullWidth className="mt-[6px]">
          Draft next order
        </ButtonLink>
      </section>
      <div className="flex gap-md">
        <SpentCard data={data} />
        <StatCard
          label="Avg per order"
          value={avg ? formatRM(avg.amount, { whole: true }) : '—'}
          note={avg ? `last ${plural(avg.count, 'order')}` : 'no totals yet'}
        />
      </div>
      {highlights.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="type-heading text-text-primary">Due this round</h2>
            <Link to="/draft" className="-my-md py-md type-caption text-text-brand hover:underline">
              See all {prediction.due.length}
            </Link>
          </div>
          <div className="flex flex-col gap-lg">
            {highlights.map((s) => {
              const item = itemsById.get(s.item_id)!
              const frequency = s.frequency[0].toUpperCase() + s.frequency.slice(1)
              return (
                <ItemRow
                  key={s.item_id}
                  to={`/history/items/${s.item_id}`}
                  name={item.canonical_name}
                  meta={`${frequency} · last ${formatDayMonth(s.lastDate)}`}
                  trailing={formatTrailing(s.suggested)}
                />
              )
            })}
          </div>
        </>
      )}
    </>
  )
}
