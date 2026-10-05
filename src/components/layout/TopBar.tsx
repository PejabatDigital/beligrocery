import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

type TopBarProps = {
  title: string
  /** Small line above the title: "Step 1 of 3", a date, "Order". */
  subtitle?: ReactNode
  /** Where back goes. Defaults to the previous page. */
  backTo?: string
  onBack?: () => void
}

export function TopBar({ title, subtitle, backTo, onBack }: TopBarProps) {
  const navigate = useNavigate()
  const back = () => {
    if (onBack) onBack()
    else if (backTo) navigate(backTo)
    else navigate(-1)
  }
  return (
    <header className="flex items-center gap-md">
      <button
        type="button"
        onClick={back}
        aria-label="Back"
        className="-my-sm -ml-md flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full type-title text-text-primary"
      >
        ‹
      </button>
      <div className="-ml-xs flex min-w-0 flex-col">
        {subtitle && <span className="type-caption text-text-secondary">{subtitle}</span>}
        <h1 className="truncate type-heading text-text-primary">{title}</h1>
      </div>
    </header>
  )
}
