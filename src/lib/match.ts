import type { CatalogueEntry } from './types'

/** Lowercase, drop punctuation, collapse whitespace: "Milo  (medium)" → "milo medium". */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9&]+/g, ' ')
    .trim()
}

function editDistance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const temp = prev[j]
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1))
      diag = temp
    }
  }
  return prev[b.length]
}

export type MatchResult = { item: CatalogueEntry; confidence: 'high' | 'low' } | null

/**
 * Find the catalogue item a written name refers to.
 * Exact name or alias → high confidence. A one-letter typo ("telur" / "telor") or a
 * shared leading word ("milo medium" / "milo") → low confidence, for the user to confirm.
 */
export function matchItem(name: string, catalogue: CatalogueEntry[]): MatchResult {
  const target = normalizeName(name)
  if (!target) return null

  for (const item of catalogue) {
    const names = [item.canonical_name, ...item.aliases].map(normalizeName)
    if (names.includes(target)) return { item, confidence: 'high' }
  }

  let best: { item: CatalogueEntry; score: number } | null = null
  for (const item of catalogue) {
    for (const candidate of [item.canonical_name, ...item.aliases].map(normalizeName)) {
      let score = Infinity
      if (target.length >= 4 && candidate.length >= 4) {
        const d = editDistance(target, candidate)
        if (d <= 1) score = d
      }
      if (
        score === Infinity &&
        (target.startsWith(`${candidate} `) || candidate.startsWith(`${target} `))
      ) {
        score = 2
      }
      if (score < (best?.score ?? Infinity)) best = { item, score }
    }
  }
  return best ? { item: best.item, confidence: 'low' } : null
}

/** True if this written name should be remembered as a new alias of the item. */
export function isNewAlias(name: string, item: Pick<CatalogueEntry, 'canonical_name' | 'aliases'>): boolean {
  const n = normalizeName(name)
  return !!n && ![item.canonical_name, ...item.aliases].some((a) => normalizeName(a) === n)
}
