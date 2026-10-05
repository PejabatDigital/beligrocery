// Figma: Components › Toggle (2:13). 44 × 26 pill, 20px knob.
// The visible switch is 26px tall; an invisible margin brings the tap target to 44px.

type ToggleProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  className?: string
}

export function Toggle({ checked, onChange, label, className = '' }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={[
        'relative h-[26px] w-11 shrink-0 cursor-pointer rounded-full transition-colors',
        'after:absolute after:-inset-[9px] after:content-[""]',
        checked ? 'bg-bg-brand' : 'bg-bg-subtle ring-1 ring-border-strong ring-inset',
        className,
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={[
          'absolute top-[3px] size-5 rounded-full bg-bg-surface transition-[left] motion-reduce:transition-none',
          checked ? 'left-[21px]' : 'left-1',
        ].join(' ')}
      />
    </button>
  )
}
