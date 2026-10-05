import { parseLocal } from './parse-local'
import { parseResultSchema, type ParseResult } from './parse-schema'
import type { Store } from './store'
import type { CatalogueEntry } from './types'

export class ParseError extends Error {}

export type ParseOutcome = { result: ParseResult; usedAI: boolean }

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

async function parseRemote(store: Store, rawText: string, catalogue: CatalogueEntry[]): Promise<ParseResult> {
  const token = await store.getAccessToken()
  const res = await fetch('/api/parse-order', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ raw_text: rawText, catalogue }),
  })
  if (res.status === 429) throw new ParseError("You've read a lot of lists this hour. Try again a bit later.")
  if (!res.ok) throw new Error(`parse-order ${res.status}`)
  return parseResultSchema.parse(await res.json())
}

/**
 * Read a pasted order. Uses the AI parser when Supabase is configured, otherwise (local mode)
 * the rule-based reader. If the API is unreachable, falls back to the rule-based reader too.
 */
export async function parseOrderText(store: Store, rawText: string, catalogue: CatalogueEntry[]): Promise<ParseOutcome> {
  const started = Date.now()
  let outcome: ParseOutcome
  if (store.mode === 'local') {
    outcome = { result: parseLocal(rawText, catalogue), usedAI: false }
  } else {
    try {
      outcome = { result: reconcile(await parseRemote(store, rawText, catalogue), catalogue), usedAI: true }
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
