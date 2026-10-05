// Figma: Components › Progress Card (2:43)
// Home: Learning state (1–5 orders). Fill segments to match orders logged.

type ProgressCardProps = {
  filled: number
  total: number
  title: string
  body: string
  className?: string
}

export function ProgressCard({ filled, total, title, body, className = '' }: ProgressCardProps) {
  return (
    <div className={`flex flex-col gap-md rounded-lg bg-bg-brand-subtle p-xl ${className}`}>
      <p className="type-heading text-text-brand">{title}</p>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={filled}
        aria-label={title}
        className="flex gap-[6px]"
      >
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`h-2 flex-1 rounded-[4px] ${i < filled ? 'bg-bg-brand' : 'bg-bg-surface'}`} />
        ))}
      </div>
      <p className="type-body text-text-secondary">{body}</p>
    </div>
  )
}
