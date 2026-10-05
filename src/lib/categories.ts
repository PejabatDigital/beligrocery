export const CATEGORIES = ['protein', 'produce', 'dairy', 'pantry'] as const

export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_LABELS: Record<Category, string> = {
  protein: 'Protein',
  produce: 'Produce',
  dairy: 'Dairy',
  pantry: 'Pantry',
}
