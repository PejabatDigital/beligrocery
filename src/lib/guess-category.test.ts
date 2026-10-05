import { describe, expect, it } from 'vitest'
import { FIXTURE_ORDER_TEXT } from './__fixtures__/orders'
import { guessCategory } from './guess-category'
import { parseLocal } from './parse-local'

describe('guessCategory', () => {
  it('groups every item in the fixture order', () => {
    const items = parseLocal(FIXTURE_ORDER_TEXT, [], '2026-10-03').orders[0].items
    const guesses = Object.fromEntries(items.map((i) => [i.name, guessCategory(i.name)]))
    expect(guesses).toEqual({
      Ayam: 'protein',
      'Fish (any type)': 'protein',
      Daging: 'protein',
      Tempura: 'protein',
      Hotdog: 'protein',
      'Fresh milk': 'dairy',
      'Susu pekat F&N': 'dairy',
      Telor: 'dairy',
      'Sardin Cap Ayam': 'pantry',
      Gardenia: 'pantry',
      'Biskut lemak': 'pantry',
      milo: 'pantry',
      'Asam jawa': 'pantry',
      'Sos tiram': 'pantry',
      'Cili padi': 'produce',
      'Margarine Planta': 'dairy',
    })
  })

  it('reads two-word phrases', () => {
    expect(guessCategory('Kacang panjang')).toBe('produce')
    expect(guessCategory('Dutch Lady UHT')).toBe('dairy')
  })

  it('returns null for words it does not know', () => {
    expect(guessCategory('Xyzzy')).toBeNull()
  })
})
