import type { ReactNode } from 'react'

// Selectable card from Setup › How often and Setup › Past orders.

type OptionCardProps = {
  selected: boolean
  onSelect: () => void
  title: string
  description?: string
  eyebrow?: ReactNode
  disabled?: boolean
  size?: 'compact' | 'large'
}

export function OptionCard({ selected, onSelect, title, description, eyebrow, disabled, size = 'compact' }: OptionCardProps) {
  const large = size === 'large'
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={[
        'flex w-full cursor-pointer items-center gap-sm border p-lg text-left transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-60',
        large ? 'rounded-lg' : 'rounded-md',
        selected ? 'border-border-brand bg-bg-brand-subtle text-text-brand' : 'border-border-default bg-bg-surface text-text-primary hover:enabled:border-border-strong',
      ].join(' ')}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-[6px]">
        {eyebrow && <span className="type-label">{eyebrow}</span>}
        <span className={large ? 'type-heading' : selected ? 'type-body-strong' : 'type-body'}>{title}</span>
        {description && <span className="type-body text-text-secondary">{description}</span>}
      </span>
      {selected && !large && (
        <span aria-hidden="true" className="type-body-strong">
          ✓
        </span>
      )}
    </button>
  )
}
