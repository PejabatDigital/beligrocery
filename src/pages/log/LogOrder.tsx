import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppData } from '../../app/useAppData'
import { Button } from '../../components/Button'
import { CategoryChip } from '../../components/CategoryChip'
import { ItemRow } from '../../components/ItemRow'
import { Screen } from '../../components/layout/Screen'
import { SectionLabel } from '../../components/layout/SectionLabel'
import { TopBar } from '../../components/layout/TopBar'
import { CATEGORIES, CATEGORY_LABELS } from '../../lib/categories'
import { formatDate, isValidISODate, todayISO } from '../../lib/dates'
import { formatQuantity, formatRM, formatTrailing, plural, possessive } from '../../lib/format'
import { AI_ENABLED, ParseError, parseOrderText } from '../../lib/parse-client'
import { parseLocal } from '../../lib/parse-local'
import type { DraftLine, ISODate } from '../../lib/types'
import { fromDraft, fromParsed, isResolved, lineCategory, toDraftLine, type ReviewLine } from './reviewLines'

export type LogPrefill = { lines: DraftLine[]; raw_text: string }

type Step = 'paste' | 'reading' | 'review'

/** Width that fits a money value: digits are 1ch, the decimal point much narrower. */
const fieldWidth = (value: string) => `${[...value].reduce((w, c) => w + (/[.,]/.test(c) ? 0.4 : 1), 0) + 0.2}ch`

/** Figma: Log › Paste order (6:44) → Reading (6:63) → Review order (6:73). */
export function LogOrder() {
  const data = useAppData()
  const navigate = useNavigate()
  const prefill = (useLocation().state as { prefill?: LogPrefill } | null)?.prefill

  const [step, setStep] = useState<Step>(prefill ? 'review' : 'paste')
  const [text, setText] = useState('')
  const [pasteError, setPasteError] = useState<string | null>(null)
  const [lines, setLines] = useState<ReviewLine[]>(() => (prefill ? fromDraft(prefill.lines) : []))
  const [date, setDate] = useState<ISODate>(todayISO())
  const [total, setTotal] = useState('')
  const [notes, setNotes] = useState<string[]>([])
  const [rawText, setRawText] = useState(prefill?.raw_text ?? '')

  async function read() {
    setPasteError(null)
    setStep('reading')
    try {
      const { result, usedAI } = await parseOrderText(text, data.catalogue)
      const [order] = result.orders
      if (!order || order.items.length === 0) {
        setPasteError("Couldn't find any items. Put one item on each line.")
        setStep('paste')
        return
      }
      const found: string[] = []
      if (!order.order_date) found.push("No date in the list, so it's set to today. Tap the date to change it.")
      if (order.total_rm == null) found.push('No total in the list. Add it above if you know it.')
      if (result.orders.length > 1) found.push('This looks like more than one order. Only the first one was read.')
      if (!usedAI && AI_ENABLED) found.push('Read without AI this time, so check the items carefully.')
      setLines(fromParsed(order.items, data.catalogue))
      setDate(order.order_date ?? todayISO())
      setTotal(order.total_rm != null ? order.total_rm.toFixed(2) : '')
      setNotes(found)
      setRawText(text)
      setStep('review')
    } catch (e) {
      setPasteError(e instanceof ParseError ? e.message : "Couldn't read the list. Try again.")
      setStep('paste')
    }
  }

  if (step === 'paste') {
    return <Paste text={text} onChange={setText} onRead={read} error={pasteError} />
  }
  if (step === 'reading') {
    return <Reading count={parseLocal(text, []).orders[0]?.items.length ?? 0} name={data.name} hasCatalogue={data.items.length > 0} />
  }
  return (
    <Review
      lines={lines}
      setLines={setLines}
      date={date}
      setDate={setDate}
      total={total}
      setTotal={setTotal}
      notes={notes}
      rawText={rawText}
      onBack={() => (prefill ? navigate(-1) : setStep('paste'))}
    />
  )
}

function Paste({ text, onChange, onRead, error }: { text: string; onChange: (t: string) => void; onRead: () => void; error: string | null }) {
  // Instant, rule-based preview of what the list contains.
  const spotted = useMemo(() => (text.trim() ? parseLocal(text, []).orders[0] : undefined), [text])
  const chips = spotted
    ? [
        spotted.order_date && `Date · ${formatDate(spotted.order_date)}`,
        spotted.total_rm != null && `Total · ${formatRM(spotted.total_rm)}`,
        spotted.items.length > 0 && plural(spotted.items.length, 'item'),
      ].filter((c): c is string => !!c)
    : []

  return (
    <Screen
      footer={
        <Button fullWidth onClick={onRead} disabled={!text.trim()}>
          Read my list
        </Button>
      }
    >
      <TopBar title="New order" backTo="/home" />
      <p className="type-body text-text-secondary">Paste the list from WhatsApp. Include the date and total at the top.</p>
      <textarea
        aria-label="Order list"
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder={'Date · Total\nItem × quantity\nItem × quantity'}
        autoFocus
        spellCheck={false}
        className="h-[330px] w-full resize-none rounded-md border border-border-brand bg-bg-surface px-lg py-[14px] type-body text-text-primary placeholder:text-text-secondary focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-border-brand"
      />
      {error && (
        <p role="alert" className="type-caption text-text-accent">
          {error}
        </p>
      )}
      {chips.length > 0 && (
        <>
          <SectionLabel>We spotted</SectionLabel>
          <div className="flex flex-wrap gap-sm">
            {chips.map((c) => (
              <span key={c} className="rounded-full bg-bg-brand-subtle px-md py-[6px] type-caption text-text-brand">
                {c}
              </span>
            ))}
          </div>
        </>
      )}
    </Screen>
  )
}

function Reading({ count, name, hasCatalogue }: { count: number; name: string; hasCatalogue: boolean }) {
  const items = plural(count, 'item')
  return (
    <Screen centered>
      <div className="flex flex-col items-center gap-lg text-center" role="status">
        <span aria-hidden="true" className="rounded-full bg-bg-brand-subtle px-[20px] py-lg type-title text-text-brand">
          …
        </span>
        <h1 className="type-title text-text-primary">Reading your list…</h1>
        <p className="type-body text-text-secondary">
          {hasCatalogue && name ? `Matching ${items} to ${possessive(name)} past orders` : `Sorting ${items} into groups`}
        </p>
      </div>
      {[100, 70, 40].map((opacity) => (
        <div
          key={opacity}
          aria-hidden="true"
          className="h-[60px] w-full animate-pulse rounded-md bg-bg-subtle motion-reduce:animate-none"
          style={{ opacity: opacity / 100 }}
        />
      ))}
    </Screen>
  )
}

type ReviewProps = {
  lines: ReviewLine[]
  setLines: React.Dispatch<React.SetStateAction<ReviewLine[]>>
  date: ISODate
  setDate: (d: ISODate) => void
  total: string
  setTotal: (t: string) => void
  notes: string[]
  rawText: string
  onBack: () => void
}

function Review({ lines, setLines, date, setDate, total, setTotal, notes, rawText, onBack }: ReviewProps) {
  const data = useAppData()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)

  const toCheck = lines.filter((l) => l.needsCheck)
  const autoGrouped = lines.filter((l) => l.autoGrouped).length
  const unresolved = lines.filter((l) => !isResolved(l)).length
  const totalValue = total.trim() === '' ? null : Number(total.replace(',', '.'))
  const totalInvalid = totalValue != null && (Number.isNaN(totalValue) || totalValue < 0)

  const update = (key: string, patch: Partial<ReviewLine>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)))

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const id = await data.store.saveOrder({
        order_date: date,
        total_rm: totalValue,
        raw_text: rawText,
        lines: lines.map(toDraftLine),
      })
      await data.refresh()
      navigate(`/log/saved/${id}`, { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save the order. Try again.")
      setSaving(false)
    }
  }

  return (
    <Screen
      footer={
        <>
          {error && (
            <p role="alert" className="type-caption text-text-accent">
              {error}
            </p>
          )}
          <Button fullWidth onClick={save} disabled={saving || unresolved > 0 || totalInvalid || !isValidISODate(date)}>
            {saving ? 'Saving…' : unresolved > 0 ? `Check ${plural(unresolved, 'item')} to save` : 'Save order'}
          </Button>
        </>
      }
    >
      <TopBar
        title="Review order"
        onBack={onBack}
        subtitle={
          <label className="relative inline-flex cursor-pointer underline decoration-dotted underline-offset-2">
            <span>{isValidISODate(date) ? formatDate(date) : 'Set a date'}</span>
            <input
              type="date"
              aria-label="Order date"
              value={date}
              max={todayISO()}
              onChange={(e) => setDate(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
        }
      />

      <div className="flex items-center gap-sm rounded-lg border border-border-default bg-bg-surface p-lg">
        <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <span className="type-body-strong text-text-primary">{plural(lines.length, 'item')}</span>
          <label htmlFor="order-total" className="type-caption text-text-secondary">
            Total paid
          </label>
        </div>
        <div className="flex items-baseline gap-[0.25em] type-number text-text-primary">
          <span>RM</span>
          <input
            id="order-total"
            inputMode="decimal"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            placeholder="0.00"
            aria-invalid={totalInvalid}
            style={{ width: fieldWidth(total || '0.00') }}
            className="max-w-[9ch] bg-transparent placeholder:text-text-secondary focus:outline-none"
          />
        </div>
      </div>
      {notes.map((n) => (
        <p key={n} className="-mt-sm type-caption text-text-secondary">
          {n}
        </p>
      ))}

      {toCheck.length > 0 && (
        <>
          <SectionLabel tone="warning">Check {plural(toCheck.length, 'item')}</SectionLabel>
          <div className="flex flex-col gap-md">
            {toCheck.map((line) => (
              <CheckCard
                key={line.key}
                line={line}
                matchedName={line.item_id ? data.itemsById.get(line.item_id)?.canonical_name : undefined}
                update={(patch) => update(line.key, patch)}
              />
            ))}
          </div>
        </>
      )}

      <SectionLabel>All items · {lines.length}</SectionLabel>
      {autoGrouped > 0 && (
        <p className="-mt-sm type-caption text-text-secondary">
          {autoGrouped === 1 ? '1 new item was' : `${autoGrouped} new items were`} put in a group automatically. Tap a
          new item to change its group.
        </p>
      )}
      <div className="flex flex-col gap-lg">
        {lines.map((line) => {
          const category = lineCategory(line, data.catalogue)
          const isNew = !line.item_id && !line.pendingMatch
          const meta = [formatQuantity(line), category ? CATEGORY_LABELS[category] : 'Pick a group', isNew && 'new']
            .filter(Boolean)
            .join(' · ')
          const open = editing === line.key
          return (
            <div key={line.key} className="flex flex-col gap-sm">
              <ItemRow
                name={line.name}
                meta={meta}
                trailing={formatTrailing(line)}
                onClick={isNew ? () => setEditing(open ? null : line.key) : undefined}
                expanded={isNew ? open : undefined}
              />
              {open && (
                <div className="flex flex-wrap gap-[6px] px-xs" role="group" aria-label={`Group for ${line.name}`}>
                  {CATEGORIES.map((c) => (
                    <CategoryChip
                      key={c}
                      category={c}
                      selected={line.category == null ? undefined : line.category === c}
                      onClick={() => {
                        update(line.key, { category: c })
                        setEditing(null)
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Screen>
  )
}

type CheckCardProps = { line: ReviewLine; matchedName?: string; update: (patch: Partial<ReviewLine>) => void }

function CheckCard({ line, matchedName, update }: CheckCardProps) {
  const title = line.raw_line || line.name
  return (
    <div className="flex flex-col gap-[6px] rounded-lg bg-bg-warning-subtle p-lg">
      <p className="type-body-strong text-text-primary">{title}</p>
      {line.pendingMatch ? (
        <>
          <p className="type-caption text-text-warning">Same as {line.pendingMatch.name}?</p>
          <div className="mt-xs flex gap-sm">
            <Button
              variant="secondary"
              className="!px-lg"
              onClick={() => update({ item_id: line.pendingMatch!.item_id, pendingMatch: null })}
            >
              Yes, same item
            </Button>
            <Button variant="ghost" className="!px-lg" onClick={() => update({ pendingMatch: null, item_id: null })}>
              No, it's new
            </Button>
          </div>
        </>
      ) : line.item_id ? (
        <p className="type-caption text-text-warning">
          Saved as {matchedName ?? 'an item you’ve ordered before'}. Next time it’s matched automatically.
        </p>
      ) : (
        <>
          <p className="type-caption text-text-warning">New item. Which group does it belong to?</p>
          <div className="flex flex-wrap gap-[6px]">
            {CATEGORIES.map((c) => (
              <CategoryChip
                key={c}
                category={c}
                selected={line.category == null ? undefined : line.category === c}
                onClick={() => update({ category: c })}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
