import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAppData } from '../../app/useAppData'
import { Button } from '../../components/Button'
import { ItemRow } from '../../components/ItemRow'
import { Screen } from '../../components/layout/Screen'
import { SectionLabel } from '../../components/layout/SectionLabel'
import { TopBar } from '../../components/layout/TopBar'
import { inputClass } from '../../components/TextField'
import { copyText } from '../../lib/clipboard'
import { formatWeekdayDate } from '../../lib/dates'
import { formatQuantity, formatWhatsAppLine } from '../../lib/format'
import { matchItem } from '../../lib/match'
import { parseItemLine } from '../../lib/parse-local'
import type { ItemStats } from '../../lib/predict'
import type { DraftLine } from '../../lib/types'

export type CopiedState = { text: string; lines: DraftLine[]; date: string }

type ExtraLine = { key: string; name: string; quantity: number | null; unit: string | null; amount_rm: number | null; item_id: string | null }

// Figma: Order day › Draft next order (6:131)
export function Draft() {
  const data = useAppData()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { prediction, itemsById, catalogue } = data
  const addId = params.get('add')

  const [on, setOn] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const s of prediction.due) initial[s.item_id] = true
    for (const s of prediction.notDue) initial[s.item_id] = false
    if (addId && addId in initial) initial[addId] = true
    return initial
  })
  const [extras, setExtras] = useState<ExtraLine[]>([])
  const [adding, setAdding] = useState(false)
  const [newItem, setNewItem] = useState('')
  const [copyError, setCopyError] = useState(false)

  if (!prediction.ready || !prediction.nextOrderDate) return <Navigate to="/home" replace />
  const next = prediction.nextOrderDate

  const toggle = (id: string) => (value: boolean) => setOn((prev) => ({ ...prev, [id]: value }))
  // Items added from Item detail move up to "Due this round".
  const promoted = prediction.notDue.filter((s) => s.item_id === addId)
  const dueList = [...prediction.due, ...promoted]
  const notDueList = prediction.notDue.filter((s) => s.item_id !== addId)

  function addExtra(e: FormEvent) {
    e.preventDefault()
    const parsed = parseItemLine(newItem)
    if (!parsed) return
    const match = matchItem(parsed.name, catalogue)
    if (match?.confidence === 'high' && match.item.id in on) {
      setOn((prev) => ({ ...prev, [match.item.id]: true }))
    } else {
      setExtras((prev) => [
        ...prev,
        {
          key: crypto.randomUUID(),
          ...parsed,
          quantity: parsed.quantity ?? (parsed.amount_rm == null ? 1 : null),
          item_id: match?.confidence === 'high' ? match.item.id : null,
        },
      ])
    }
    setNewItem('')
    setAdding(false)
  }

  const selected: DraftLine[] = [
    ...[...dueList, ...notDueList]
      .filter((s) => on[s.item_id])
      .map((s) => {
        const item = itemsById.get(s.item_id)!
        return {
          raw_line: formatWhatsAppLine(item.canonical_name, s.suggested),
          name: item.canonical_name,
          ...s.suggested,
          item_id: item.id,
          category: item.category,
        }
      }),
    ...extras.map((x) => ({
      raw_line: formatWhatsAppLine(x.name, x),
      name: x.name,
      quantity: x.quantity,
      unit: x.unit,
      amount_rm: x.amount_rm,
      item_id: x.item_id,
      category: x.item_id ? (itemsById.get(x.item_id)?.category ?? null) : null,
    })),
  ]

  async function copy() {
    const text = selected.map((l) => l.raw_line).join('\n')
    if (!(await copyText(text))) {
      setCopyError(true)
      return
    }
    navigate('/draft/copied', { state: { text, lines: selected, date: next } satisfies CopiedState })
  }

  const row = (s: ItemStats) => {
    const item = itemsById.get(s.item_id)!
    const qty = formatQuantity(s.suggested)
    return (
      <ItemRow
        key={s.item_id}
        mode="draft"
        name={item.canonical_name}
        meta={[qty, s.item_id === addId && !s.due ? 'added by you' : s.reason].filter(Boolean).join(' · ')}
        checked={!!on[s.item_id]}
        onCheckedChange={toggle(s.item_id)}
      />
    )
  }

  return (
    <Screen
      footer={
        <>
          {copyError && (
            <p role="alert" className="type-caption text-text-accent">
              Couldn't copy to the clipboard. Try again.
            </p>
          )}
          <Button fullWidth onClick={copy} disabled={selected.length === 0}>
            Copy for WhatsApp
          </Button>
        </>
      }
    >
      <TopBar subtitle={formatWeekdayDate(next)} title="Next order" backTo="/home" />
      <p className="type-body text-text-secondary">
        Based on {prediction.ordersLogged} past orders. Switch off anything {data.name || 'they'} {data.name ? "doesn't" : "don't"}{' '}
        need this time.
      </p>

      <SectionLabel tone="brand">Due this round · {dueList.length + extras.length}</SectionLabel>
      <div className="flex flex-col gap-lg">
        {dueList.map(row)}
        {extras.map((x) => (
          <ItemRow
            key={x.key}
            mode="draft"
            name={x.name}
            meta={[formatQuantity(x), 'added by you'].filter(Boolean).join(' · ')}
            checked
            onCheckedChange={() => setExtras((prev) => prev.filter((p) => p.key !== x.key))}
          />
        ))}
      </div>

      {notDueList.length > 0 && (
        <>
          <SectionLabel>Not due · {notDueList.length}</SectionLabel>
          <div className="flex flex-col gap-lg">{notDueList.map(row)}</div>
        </>
      )}

      {adding ? (
        <form onSubmit={addExtra} className="flex gap-sm">
          <input
            aria-label="Item to add"
            autoFocus
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Item × quantity"
            className={`${inputClass} !py-md`}
          />
          <Button type="submit" variant="secondary" disabled={!newItem.trim()}>
            Add
          </Button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="-my-md self-start py-md type-body-strong text-text-brand hover:underline"
        >
          + Add an item
        </button>
      )}
    </Screen>
  )
}
