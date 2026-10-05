import type { ISODate } from './types'

// Dates are plain calendar days in Asia/Kuala_Lumpur. Internally we do arithmetic on
// UTC-midnight Date objects so day counts never drift with the viewer's timezone.

export const TIMEZONE = 'Asia/Kuala_Lumpur'

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_MS = 86_400_000

/** Today's date in Kuala Lumpur. */
export function todayISO(now: Date = new Date()): ISODate {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(now)
}

function toUTC(date: ISODate): Date {
  return new Date(`${date}T00:00:00Z`)
}

function fromUTC(d: Date): ISODate {
  return d.toISOString().slice(0, 10)
}

export function addDays(date: ISODate, days: number): ISODate {
  return fromUTC(new Date(toUTC(date).getTime() + days * DAY_MS))
}

/** Whole days from a to b (positive when b is later). */
export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((toUTC(b).getTime() - toUTC(a).getTime()) / DAY_MS)
}

export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const d = toUTC(value)
  return !Number.isNaN(d.getTime()) && fromUTC(d) === value
}

export function makeISODate(year: number, month1: number, day: number): ISODate | null {
  const value = `${String(year).padStart(4, '0')}-${String(month1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return isValidISODate(value) ? value : null
}

/** "3 Oct 2026": used in lists. */
export function formatDate(date: ISODate): string {
  const d = toUTC(date)
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** "26 Sep" */
export function formatDayMonth(date: ISODate): string {
  const d = toUTC(date)
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`
}

/** "Sat, 17 Oct": used for the next order. */
export function formatWeekdayDate(date: ISODate): string {
  const d = toUTC(date)
  return `${WEEKDAYS_SHORT[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`
}

/** "October 2026": History month headers (shown uppercase by the Label style). */
export function formatMonthYear(date: ISODate): string {
  const d = toUTC(date)
  return `${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** "Sep 2025" */
export function formatMonthYearShort(date: ISODate): string {
  const d = toUTC(date)
  return `${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** 'YYYY-MM' key for grouping by month. */
export function monthKey(date: ISODate): string {
  return date.slice(0, 7)
}

/** "today", "yesterday", "7 days ago" */
export function formatAgo(date: ISODate, today: ISODate = todayISO()): string {
  const days = daysBetween(date, today)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

/** "Today", "Tomorrow", "In 3 days", "2 days late" */
export function formatUntil(date: ISODate, today: ISODate = todayISO()): string {
  const days = daysBetween(today, date)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days > 1) return `In ${days} days`
  if (days === -1) return '1 day late'
  return `${-days} days late`
}

export { MONTHS_SHORT }
