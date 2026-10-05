// Figma: Components › Stat Card (2:39)

type StatCardProps = {
  label: string
  value: string
  note?: string
  /** Colour for the note, e.g. text-text-accent for a rise. */
  noteClassName?: string
  className?: string
}

export function StatCard({ label, value, note, noteClassName = 'text-text-secondary', className = '' }: StatCardProps) {
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col gap-xs rounded-lg border border-border-default bg-bg-surface p-lg ${className}`}
    >
      <span className="truncate type-label text-text-secondary">{label}</span>
      <span className="truncate type-number text-text-primary">{value}</span>
      {note && <span className={`truncate type-caption ${noteClassName}`}>{note}</span>}
    </div>
  )
}
