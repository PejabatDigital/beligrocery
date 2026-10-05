import { CATEGORY_LABELS, type Category } from '../lib/categories'

// Figma: Components › Category Chip (2:26)
// Static label by default. With onClick it becomes a choice (Review order, Order detail filters).

const STYLES: Record<Category, { chip: string; dot: string }> = {
  protein: { chip: 'bg-bg-accent-subtle text-text-accent', dot: 'bg-category-protein' },
  produce: { chip: 'bg-bg-brand-subtle text-text-brand', dot: 'bg-category-produce' },
  dairy: { chip: 'bg-bg-info-subtle text-text-info', dot: 'bg-category-dairy' },
  pantry: { chip: 'bg-bg-warning-subtle text-text-warning', dot: 'bg-category-pantry' },
}

type CategoryChipProps = {
  category: Category
  className?: string
  onClick?: () => void
  /** For choices: true = chosen, false = another one is chosen, undefined = none yet. */
  selected?: boolean
}

export function CategoryChip({ category, className = '', onClick, selected }: CategoryChipProps) {
  const styles = STYLES[category]
  const classes = [
    'inline-flex items-center gap-sm rounded-full px-md py-xs whitespace-nowrap type-caption',
    styles.chip,
    selected ? 'ring-2 ring-current ring-inset' : '',
    selected === false ? 'opacity-60' : '',
    className,
  ].join(' ')
  const content = (
    <>
      <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${styles.dot}`} />
      {CATEGORY_LABELS[category]}
    </>
  )

  if (!onClick) return <span className={classes}>{content}</span>
  return (
    <button
      type="button"
      aria-pressed={!!selected}
      onClick={onClick}
      // The chip is 26px tall; the invisible margin brings the tap target to 44px.
      className={`relative cursor-pointer transition-opacity hover:opacity-100 after:absolute after:-inset-y-[9px] after:inset-x-0 after:content-[""] ${classes}`}
    >
      {content}
    </button>
  )
}
