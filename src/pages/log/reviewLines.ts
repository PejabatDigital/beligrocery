import type { Category } from '../../lib/categories'
import { guessCategory } from '../../lib/guess-category'
import type { ParsedItem } from '../../lib/parse-schema'
import type { CatalogueEntry, DraftLine } from '../../lib/types'

/** One line on Review order, with whatever still needs the user's say. */
export type ReviewLine = DraftLine & {
  key: string
  /** A possible match the user hasn't confirmed yet ("telur" → Telor?). */
  pendingMatch: { item_id: string; name: string } | null
  /** Shown under "Check": unsure matches and new items with no guessed group. Fixed when the review starts. */
  needsCheck: boolean
  /** A new item whose group was filled in automatically (by the AI or the word list). */
  autoGrouped: boolean
}

let counter = 0
const nextKey = () => `line-${++counter}`

export function fromParsed(items: ParsedItem[], catalogue: CatalogueEntry[]): ReviewLine[] {
  const byId = new Map(catalogue.map((c) => [c.id, c]))
  return items.map((p) => {
    const match = p.matched_item_id ? byId.get(p.matched_item_id) : undefined
    const base = {
      key: nextKey(),
      raw_line: p.raw_line,
      name: p.name,
      quantity: p.quantity,
      unit: p.unit,
      amount_rm: p.amount_rm,
    }
    if (match && p.confidence === 'high') {
      return { ...base, item_id: match.id, category: match.category, pendingMatch: null, needsCheck: false, autoGrouped: false }
    }
    const category = p.category ?? match?.category ?? guessCategory(p.name)
    return {
      ...base,
      item_id: null,
      category,
      pendingMatch: match ? { item_id: match.id, name: match.canonical_name } : null,
      // Only ask when there's a possible match to confirm or no idea of the group.
      needsCheck: !!match || category == null,
      autoGrouped: !match && category != null,
    }
  })
}

export function fromDraft(lines: DraftLine[]): ReviewLine[] {
  return lines.map((l) => {
    const category = l.item_id ? l.category : (l.category ?? guessCategory(l.name))
    return {
      ...l,
      category,
      key: nextKey(),
      pendingMatch: null,
      needsCheck: !l.item_id && category == null,
      autoGrouped: !l.item_id && category != null,
    }
  })
}

export function isResolved(line: ReviewLine): boolean {
  return !line.pendingMatch && (line.item_id != null || line.category != null)
}

/** The category shown for a line: its item's, or the one picked for a new item. */
export function lineCategory(line: ReviewLine, catalogue: CatalogueEntry[]): Category | null {
  if (line.item_id) return catalogue.find((c) => c.id === line.item_id)?.category ?? line.category
  return line.category
}

export function toDraftLine({ key: _key, pendingMatch: _p, needsCheck: _n, autoGrouped: _a, ...line }: ReviewLine): DraftLine {
  return line
}
