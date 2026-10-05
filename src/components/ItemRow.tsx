import { Link } from 'react-router-dom'
import { Toggle } from './Toggle'

// Figma: Components › Item Row (2:38)
// Display in order review and history; Draft on Draft next order, with a toggle and the reason.

type Base = { name: string; meta: string; className?: string }

type DisplayProps = Base & {
  mode?: 'display'
  trailing?: string
  to?: string
  onClick?: () => void
  expanded?: boolean
}
type DraftProps = Base & { mode: 'draft'; checked: boolean; onCheckedChange: (checked: boolean) => void }

const ROW =
  'flex w-full items-center gap-md rounded-md border border-border-default bg-bg-surface px-lg py-md text-left'

function Text({ name, meta }: Pick<Base, 'name' | 'meta'>) {
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
      <span className="truncate type-body-strong text-text-primary">{name}</span>
      {meta && <span className="truncate type-caption text-text-secondary">{meta}</span>}
    </span>
  )
}

export function ItemRow(props: DisplayProps | DraftProps) {
  if (props.mode === 'draft') {
    const { name, meta, checked, onCheckedChange, className = '' } = props
    return (
      <div className={`${ROW} ${className}`}>
        <Text name={name} meta={meta} />
        <Toggle checked={checked} onChange={onCheckedChange} label={`Include ${name}`} />
      </div>
    )
  }

  const { name, meta, trailing, to, onClick, expanded, className = '' } = props
  const content = (
    <>
      <Text name={name} meta={meta} />
      {trailing && <span className="shrink-0 type-body-strong text-text-primary">{trailing}</span>}
    </>
  )
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-expanded={expanded}
        className={`${ROW} cursor-pointer transition-colors hover:border-border-strong ${className}`}
      >
        {content}
      </button>
    )
  }
  return to ? (
    <Link to={to} className={`${ROW} transition-colors hover:border-border-strong ${className}`}>
      {content}
    </Link>
  ) : (
    <div className={`${ROW} ${className}`}>{content}</div>
  )
}
