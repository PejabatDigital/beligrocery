import type { Category } from './categories'
import { normalizeName } from './match'

// Best guess at a new item's group from common Malay and English grocery words.
// Used when the AI parser isn't available or gives no category. The user can always change it.

const WORDS: Record<Category, string[]> = {
  protein: [
    'ayam', 'chicken', 'daging', 'beef', 'kambing', 'mutton', 'lamb', 'ikan', 'fish', 'udang', 'prawn',
    'prawns', 'sotong', 'squid', 'ketam', 'crab', 'kerang', 'cockles', 'hotdog', 'sosej', 'sausage',
    'sausages', 'nugget', 'nuggets', 'tempura', 'burger', 'bebola', 'fishball', 'meatball', 'salmon',
    'kembung', 'bawal', 'tenggiri', 'tilapia', 'keli', 'siakap', 'kurau', 'selar', 'pari', 'itik', 'duck',
    'tauhu', 'tofu', 'tempe', 'karipap', 'popia', 'otak',
  ],
  produce: [
    'sayur', 'vegetable', 'vegetables', 'bayam', 'kangkung', 'sawi', 'kobis', 'kubis', 'cabbage', 'carrot',
    'lobak', 'tomato', 'tomatoes', 'timun', 'cucumber', 'kentang', 'potato', 'potatoes', 'bawang', 'onion',
    'onions', 'garlic', 'halia', 'ginger', 'cili', 'chili', 'chilli', 'cabai', 'serai', 'lemongrass', 'limau',
    'lime', 'lemon', 'pisang', 'banana', 'bananas', 'epal', 'apple', 'apples', 'oren', 'orange', 'oranges',
    'betik', 'papaya', 'tembikai', 'watermelon', 'nanas', 'pineapple', 'mangga', 'mango', 'anggur', 'grape',
    'grapes', 'buah', 'fruit', 'terung', 'brinjal', 'eggplant', 'bendi', 'okra', 'taugeh', 'cendawan',
    'mushroom', 'mushrooms', 'brokoli', 'broccoli', 'salad', 'lettuce', 'lengkuas', 'kacang panjang',
    'daun kari', 'daun pandan', 'pandan', 'kelapa', 'jagung', 'corn', 'labu', 'pumpkin', 'petai',
  ],
  dairy: [
    'susu', 'milk', 'telor', 'telur', 'egg', 'eggs', 'cheese', 'keju', 'butter', 'mentega', 'marjerin',
    'margarine', 'planta', 'yogurt', 'yoghurt', 'dutch lady', 'cream', 'krim', 'dairy', 'farm fresh',
  ],
  pantry: [
    'beras', 'rice', 'gula', 'sugar', 'garam', 'salt', 'minyak', 'oil', 'tepung', 'flour', 'roti', 'bread',
    'gardenia', 'massimo', 'biskut', 'biscuit', 'biscuits', 'milo', 'nescafe', 'horlicks', 'ovaltine',
    'kopi', 'coffee', 'teh', 'tea', 'sos', 'sauce', 'kicap', 'soy', 'sardin', 'sardine', 'sardines', 'tuna',
    'mee', 'mi', 'noodle', 'noodles', 'maggi', 'bihun', 'kuey teow', 'pasta', 'spaghetti', 'rempah',
    'kari', 'curry', 'asam', 'jem', 'jam', 'kaya', 'cereal', 'oat', 'oats', 'madu', 'honey', 'santan',
    'serbuk', 'cuka', 'vinegar', 'belacan', 'kerepek', 'chips', 'air', 'water', 'jus', 'juice', 'sirap',
    'syrup', 'cordial', 'tisu', 'tissue', 'sabun', 'soap', 'detergent', 'ubat gigi', 'toothpaste',
  ],
}

const LOOKUP = new Map<string, Category>()
for (const [category, words] of Object.entries(WORDS) as [Category, string[]][]) {
  for (const w of words) LOOKUP.set(w, category)
}

/**
 * Guess a category from the item name. The leftmost recognised word wins, so the
 * product comes before the brand: "Sardin Cap Ayam" is pantry, not protein.
 */
export function guessCategory(name: string): Category | null {
  const words = normalizeName(name).split(' ').filter(Boolean)
  for (let i = 0; i < words.length; i++) {
    const pair = words[i + 1] ? `${words[i]} ${words[i + 1]}` : null
    const hit = (pair && LOOKUP.get(pair)) ?? LOOKUP.get(words[i])
    if (hit) return hit
  }
  return null
}
