import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button, ButtonLink } from '../../components/Button'
import { Screen } from '../../components/layout/Screen'
import { formatWeekdayDate } from '../../lib/dates'
import type { LogPrefill } from '../log/LogOrder'
import type { CopiedState } from './Draft'

const PREVIEW_LINES = 4

// Figma: Order day › Copied (6:170)
export function Copied() {
  const navigate = useNavigate()
  const state = useLocation().state as CopiedState | null
  if (!state) return <Navigate to="/draft" replace />

  const lines = state.text.split('\n')
  const logItNow = () =>
    navigate('/log', { state: { prefill: { lines: state.lines, raw_text: state.text } satisfies LogPrefill } })

  return (
    <Screen
      background="subtle"
      footer={
        <section
          aria-labelledby="copied-title"
          className="flex flex-col gap-md rounded-lg border border-border-default bg-bg-surface px-[20px] py-xl"
        >
          <p className="type-label whitespace-pre text-text-brand">✓  Copied</p>
          <h1 id="copied-title" className="type-heading text-text-primary">
            Paste it to the grocer on WhatsApp
          </h1>
          <p className="type-body text-text-secondary">Once it's sent, log it as the new order so the app keeps learning.</p>
          <Button fullWidth onClick={logItNow}>
            Log it now
          </Button>
          <ButtonLink to="/home" variant="ghost" fullWidth>
            Later
          </ButtonLink>
        </section>
      }
    >
      <div aria-hidden="true" className="flex flex-col gap-xs rounded-lg border border-border-default bg-bg-surface p-lg opacity-50">
        <p className="type-caption text-text-secondary">Next order · {formatWeekdayDate(state.date)}</p>
        <div className="type-body text-text-primary">
          {lines.slice(0, PREVIEW_LINES).map((l, i) => (
            <p key={i}>{l}</p>
          ))}
          {lines.length > PREVIEW_LINES && <p>…</p>}
        </div>
      </div>
    </Screen>
  )
}
