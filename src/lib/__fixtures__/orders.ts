import type { PredictOrder } from '../predict'
import { addDays } from '../dates'

// Test fixtures only: never seeded into the app.

export const FIXTURE_ORDER_TEXT = `3 Oct 2026 · RM 186.40
Ayam × 2 ekor
Fish (any type) × 1 kg
Daging × 1 kg
Tempura × 1 pek
Hotdog × 2 pek
Fresh milk × 1 kotak
Susu pekat F&N × 2 tin
Telor × 1 tray
Sardin Cap Ayam × 2 tin
Gardenia × 1 pek
Biskut lemak × 1 pek
milo x 1
Asam jawa × 1 pek
Sos tiram × 1 pek
Cili padi × RM5
Margarine Planta x 1 pek`

/**
 * Eight synthetic fortnightly orders (oldest first, ending 3 Oct 2026) built from the fixture.
 * - ayam, telor, gardenia: every order
 * - milo: orders 0, 2, 4, 6  → every 2 orders (every 4 weeks), due at order 8
 * - asam: orders 2, 6        → every 4 orders (every 8 weeks), not due for 2 more after the next
 * - sardin: order 3 only     → ordered once
 */
export function fortnightlyOrders(count = 8): PredictOrder[] {
  const last = '2026-10-03'
  return Array.from({ length: count }, (_, i) => {
    const items: PredictOrder['items'] = [
      { item_id: 'ayam', quantity: 2, unit: 'ekor', amount_rm: null },
      { item_id: 'telor', quantity: 1, unit: 'tray', amount_rm: null },
      { item_id: 'gardenia', quantity: 1, unit: 'pek', amount_rm: null },
    ]
    if (i % 2 === 0) items.push({ item_id: 'milo', quantity: 1, unit: null, amount_rm: null })
    if (i === 2 || i === 6) items.push({ item_id: 'asam', quantity: 1, unit: 'pek', amount_rm: null })
    if (i === 3) items.push({ item_id: 'sardin', quantity: 2, unit: 'tin', amount_rm: null })
    return { order_date: addDays(last, (i - (count - 1)) * 14), items }
  })
}
