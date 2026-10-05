import { Link } from 'react-router-dom'
import { formatDate } from '../lib/dates'
import { formatRM, plural } from '../lib/format'
import type { Order } from '../lib/types'

export function OrderRow({ order }: { order: Order }) {
  return (
    <Link
      to={`/history/orders/${order.id}`}
      className="flex w-full items-center gap-md rounded-md border border-border-default bg-bg-surface p-lg transition-colors hover:border-border-strong"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <span className="type-body-strong text-text-primary">{formatDate(order.order_date)}</span>
        <span className="type-caption text-text-secondary">{plural(order.items.length, 'item')}</span>
      </span>
      {order.total_rm != null && <span className="shrink-0 type-body-strong text-text-primary">{formatRM(order.total_rm)}</span>}
    </Link>
  )
}
