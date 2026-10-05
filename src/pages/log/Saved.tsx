import { Navigate, useParams } from 'react-router-dom'
import { useAppData } from '../../app/useAppData'
import { ButtonLink } from '../../components/Button'
import { Screen } from '../../components/layout/Screen'
import { formatWeekdayDate } from '../../lib/dates'
import { plural } from '../../lib/format'
import { PREDICTION_THRESHOLD } from '../../lib/predict'

// Figma: Log › Saved (6:120)
export function Saved() {
  const { id } = useParams()
  const { orders, prediction } = useAppData()
  if (!orders.some((o) => o.id === id)) return <Navigate to="/home" replace />

  const n = orders.length
  const remaining = PREDICTION_THRESHOLD - n
  const next = prediction.nextOrderDate ? formatWeekdayDate(prediction.nextOrderDate) : null
  const message =
    remaining > 0
      ? `That's ${n} of ${PREDICTION_THRESHOLD} orders. ${plural(remaining, 'more order')} until predictions switch on.`
      : n === PREDICTION_THRESHOLD
        ? `That's ${n} orders. Predictions are now on. Next order is due ${next}.`
        : `That's ${n} orders. Next order is due ${next}.`

  return (
    <Screen
      footer={
        <>
          <ButtonLink to="/home" replace fullWidth>
            Back to home
          </ButtonLink>
          <ButtonLink to={`/history/orders/${id}`} replace variant="ghost" fullWidth>
            View order
          </ButtonLink>
        </>
      }
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-lg text-center" role="status">
        <span aria-hidden="true" className="rounded-full bg-bg-brand px-xl py-[18px] type-display text-text-on-brand">
          ✓
        </span>
        <h1 className="type-title text-text-primary">Order saved</h1>
        <p className="type-body text-text-secondary">{message}</p>
      </div>
    </Screen>
  )
}
