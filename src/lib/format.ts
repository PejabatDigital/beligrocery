/** "RM 186.40", or "RM 186" with whole: true (stat cards). */
export function formatRM(amount: number, { whole = false } = {}): string {
  return whole ? `RM ${Math.round(amount)}` : `RM ${amount.toFixed(2)}`
}

/** "+RM 14" / "−RM 14" / "RM 0" for differences between orders. */
export function formatRMDelta(delta: number): string {
  const rounded = Math.round(delta)
  if (rounded === 0) return 'RM 0'
  return `${rounded > 0 ? '+' : '−'}RM ${Math.abs(rounded)}`
}

/** Compact money amount on an item line, as in the designs: "RM5", "RM2.50". */
export function formatLineAmount(amount: number): string {
  return Number.isInteger(amount) ? `RM${amount}` : `RM${amount.toFixed(2)}`
}

function formatNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100)
}

type QuantityLike = { quantity: number | null; unit: string | null; amount_rm: number | null }

/** Quantity with unit, e.g. "2 ekor", "1", "RM5". Empty string if nothing is known. */
export function formatQuantity(line: QuantityLike): string {
  if (line.quantity == null) {
    return line.amount_rm != null ? formatLineAmount(line.amount_rm) : ''
  }
  return line.unit ? `${formatNumber(line.quantity)} ${line.unit}` : formatNumber(line.quantity)
}

/** Right-hand side of an Item Row: "× 2", or "RM5" for money lines. */
export function formatTrailing(line: QuantityLike): string {
  if (line.quantity == null) {
    return line.amount_rm != null ? formatLineAmount(line.amount_rm) : ''
  }
  return `× ${formatNumber(line.quantity)}`
}

/** One WhatsApp line: "Ayam × 2 ekor", "Milo × 1", "Cili padi × RM5". */
export function formatWhatsAppLine(name: string, line: QuantityLike): string {
  if (line.quantity == null) {
    return line.amount_rm != null ? `${name} × ${formatLineAmount(line.amount_rm)}` : name
  }
  return `${name} × ${formatQuantity(line)}`
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`
}

/** Possessive for the person's name: "Mum's", "James'". */
export function possessive(name: string): string {
  return /s$/i.test(name) ? `${name}'` : `${name}'s`
}
