import { addDays, makeISODate, todayISO } from './dates'
import { matchItem } from './match'
import type { ParsedItem, ParsedOrder, ParseResult } from './parse-schema'
import type { CatalogueEntry, ISODate } from './types'

// Rule-based reader for pasted WhatsApp lists. It powers the live "We spotted" preview
// on Paste order, and stands in for the AI parser in local mode or when the API is down.

const MONTHS: Record<string, number> = {
  jan: 1, januari: 1, january: 1,
  feb: 2, februari: 2, february: 2,
  mac: 3, mar: 3, march: 3,
  apr: 4, april: 4,
  mei: 5, may: 5,
  jun: 6, june: 6,
  jul: 7, julai: 7, july: 7,
  ogos: 8, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  okt: 10, oct: 10, oktober: 10, october: 10,
  nov: 11, november: 11,
  dis: 12, dec: 12, disember: 12, december: 12,
}

const UNITS = [
  'ekor', 'kg', 'g', 'gm', 'gram', 'pek', 'peket', 'paket', 'pkt', 'tin', 'tray', 'kotak',
  'botol', 'btl', 'biji', 'bungkus', 'bks', 'ikat', 'pcs', 'pc', 'helai', 'liter', 'l',
  'ml', 'sikat', 'papan', 'keping', 'batang', 'cawan', 'balang', 'sachet', 'beg', 'karton',
]
const UNIT_RE = UNITS.join('|')

const NUM = String.raw`\d+(?:[.,]\d+)?`
// "×", "*", or a standalone x/X followed by a number or RM: "milo x 1", "x1", "X RM5"
const SEP = String.raw`(?:×|\*|(?<![A-Za-z])[xX](?=\s*(?:\d|RM)))`

const RE_MONEY = new RegExp(String.raw`^(.+?)\s*${SEP}\s*RM\s*(${NUM})\s*$`, 'i')
const RE_QTY = new RegExp(String.raw`^(.+?)\s*${SEP}\s*(${NUM})\s*([A-Za-z]+)?\.?\s*$`)
const RE_TRAILING = new RegExp(String.raw`^(.+?)\s+(${NUM})\s*(${UNIT_RE})\.?\s*$`, 'i')
const RE_LEADING = new RegExp(String.raw`^(${NUM})\s*(${UNIT_RE})\s+(.+)$`, 'i')

const RE_DATE_WORDS = new RegExp(
  String.raw`\b(\d{1,2})(?:st|nd|rd|th)?\s+(${Object.keys(MONTHS).join('|')})\.?(?:\s+(\d{2,4}))?\b`,
  'i',
)
const RE_DATE_NUMERIC = /\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})\b/
const RE_RM = new RegExp(String.raw`RM\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)`, 'i')
const RE_TOTAL_LINE = /^(?:total|jumlah|grand total)\b/i
const RE_BULLET = /^\s*(?:[-•*·]|\d{1,2}[.)])\s+/

function toNumber(s: string): number {
  return Number(s.replace(',', '.'))
}

function resolveYear(day: number, month: number, year: number | null, today: ISODate): ISODate | null {
  if (year != null) {
    const full = year < 100 ? 2000 + year : year
    return makeISODate(full, month, day)
  }
  // No year: the most recent such date, allowing up to a week ahead for upcoming orders.
  const thisYear = Number(today.slice(0, 4))
  const candidate = makeISODate(thisYear, month, day)
  if (!candidate) return null
  return candidate > addDays(today, 7) ? makeISODate(thisYear - 1, month, day) : candidate
}

/** Find a Malaysian-style date in a line: "3 Oct 2026", "3 Okt", "3/10/26". */
export function findDate(line: string, today: ISODate = todayISO()): ISODate | null {
  const words = line.match(RE_DATE_WORDS)
  if (words) {
    const month = MONTHS[words[2].toLowerCase()]
    return resolveYear(Number(words[1]), month, words[3] ? Number(words[3]) : null, today)
  }
  const numeric = line.match(RE_DATE_NUMERIC)
  if (numeric) {
    // Day first, as written in Malaysia.
    return resolveYear(Number(numeric[1]), Number(numeric[2]), Number(numeric[3]), today)
  }
  return null
}

function findTotal(line: string): number | null {
  const m = line.match(RE_RM)
  return m ? Number(m[1].replace(/,/g, '')) : null
}

type LineParse = Pick<ParsedItem, 'name' | 'quantity' | 'unit' | 'amount_rm'>

/** Split one item line into name, quantity, unit and money amount. */
export function parseItemLine(line: string): LineParse | null {
  const text = line.replace(RE_BULLET, '').trim()
  if (!/[A-Za-z]/.test(text)) return null

  let m = text.match(RE_MONEY)
  if (m) return { name: m[1].trim(), quantity: null, unit: null, amount_rm: toNumber(m[2]) }

  m = text.match(RE_QTY)
  if (m) {
    return { name: m[1].trim(), quantity: toNumber(m[2]), unit: m[3]?.toLowerCase() ?? null, amount_rm: null }
  }

  m = text.match(RE_TRAILING)
  if (m) return { name: m[1].trim(), quantity: toNumber(m[2]), unit: m[3].toLowerCase(), amount_rm: null }

  m = text.match(RE_LEADING)
  if (m) return { name: m[3].trim(), quantity: toNumber(m[1]), unit: m[2].toLowerCase(), amount_rm: null }

  return { name: text, quantity: null, unit: null, amount_rm: null }
}

function isHeaderLine(line: string, today: ISODate): boolean {
  if (RE_TOTAL_LINE.test(line)) return true
  if (!findDate(line, today)) return false
  // A date line is a header unless it also reads as an item ("Ayam × 2").
  const item = parseItemLine(line)
  return !item || (item.quantity == null && item.amount_rm == null)
}

/** Parse pasted text into one or more orders. Each dated header line starts a new order. */
export function parseLocal(rawText: string, catalogue: CatalogueEntry[], today: ISODate = todayISO()): ParseResult {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !/^[.…\s]+$/.test(l))

  const orders: ParsedOrder[] = []
  let current: ParsedOrder | null = null
  const startOrder = () => {
    current = { order_date: null, total_rm: null, items: [] }
    orders.push(current)
    return current
  }

  for (const line of lines) {
    if (isHeaderLine(line, today)) {
      const date = findDate(line, today)
      const total = findTotal(line)
      let order: ParsedOrder = current ?? startOrder()
      // A second date after items have been read means a second order (bulk paste).
      if (date && (order.order_date || order.items.length > 0)) order = startOrder()
      if (date) order.order_date = date
      if (total != null) order.total_rm = total
      continue
    }

    const parsed = parseItemLine(line)
    if (!parsed) continue
    const order: ParsedOrder = current ?? startOrder()
    const match = matchItem(parsed.name, catalogue)
    order.items.push({
      raw_line: line,
      ...parsed,
      category: match?.item.category ?? null,
      matched_item_id: match?.item.id ?? null,
      confidence: match?.confidence ?? 'low',
    })
  }

  const warnings: string[] = []
  if (orders.length === 0) warnings.push('No items found')
  if (orders.some((o) => !o.order_date)) warnings.push('No date found')
  if (orders.some((o) => o.total_rm == null)) warnings.push('No total found')
  return { orders, warnings }
}
