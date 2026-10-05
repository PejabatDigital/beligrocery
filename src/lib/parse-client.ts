import { parseLocal } from './parse-local'
import { parseResultSchema, type ParseResult } from './parse-schema'
import type { CatalogueEntry } from './types'

export class ParseError extends Error {}

export type ParseOutcome = { result: ParseResult; usedAI: boolean }

/** AI reading is off unless the build sets VITE_AI_PARSING=on (and the function has ANTHROPIC_API_KEY). */
export const AI_ENABLED = import.meta.env.VITE_AI_PARSING === 'on'

const MIN_READING_MS = 700

/** Keep catalogue matches honest: drop ids the catalogue doesn't have, and trust the catalogue's category. */
function reconcile(result: ParseResult, catalogue: CatalogueEntry[]): ParseResult {
  const byId = new Map(catalogue.map((c) => [c.id, c]))
  return {
    ...result,
    orders: result.orders.map((o) => ({
      ...o,
      items: o.items.map((item) => {
        const match = item.matched_item_id ? byId.get(item.matched_item_id) : undefined
        if (item.matched_item_id && !match) return { ...item, matched_item_id: null, confidence: 'low' as const }
        return match ? { ...item, category: match.category } : item
      }),
    })),
  }
}

async function parseRemote(rawText: string, catalogue: CatalogueEntry[]): Promise<ParseResult> {
  const res = await fetch('/api/parse-order', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ raw_text: rawText, catalogue }),
  })
  if (!res.ok) throw new Error(`parse-order ${res.status}`)
  return parseResultSchema.parse(await res.json())
}

/**
 * Read a pasted order. Uses the AI parser when it's switched on, otherwise the rule-based reader.
 * If the API is unreachable, falls back to the rule-based reader too.
 */
export async function parseOrderText(rawText: string, catalogue: CatalogueEntry[]): Promise<ParseOutcome> {
  const started = Date.now()
  let outcome: ParseOutcome
  if (!AI_ENABLED) {
    outcome = { result: parseLocal(rawText, catalogue), usedAI: false }
  } else {
    try {
      outcome = { result: reconcile(await parseRemote(rawText, catalogue), catalogue), usedAI: true }
    } catch (e) {
      if (e instanceof ParseError) throw e
      console.warn('AI parsing unavailable, reading with rules instead', e)
      outcome = { result: parseLocal(rawText, catalogue), usedAI: false }
    }
  }
  // Let the Reading screen register instead of flashing.
  const wait = MIN_READING_MS - (Date.now() - started)
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  return outcome
}
