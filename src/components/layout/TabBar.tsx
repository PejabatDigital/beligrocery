import { NavLink } from 'react-router-dom'

// Insights is designed for v2: shown, but not available yet.

const TAB = 'flex min-h-11 items-center px-xs type-body'

export function TabBar() {
  const cls = ({ isActive }: { isActive: boolean }) =>
    `${TAB} ${isActive ? 'font-semibold text-text-brand' : 'text-text-secondary hover:text-text-primary'}`
  return (
    <nav
      aria-label="Main"
      className="flex items-center justify-between rounded-full border border-border-default bg-bg-surface px-[28px] py-[3px]"
    >
      <NavLink to="/home" className={cls}>
        Home
      </NavLink>
      <NavLink to="/history" className={cls}>
        History
      </NavLink>
      <span aria-disabled="true" title="Coming soon" className={`${TAB} cursor-default text-text-secondary opacity-60`}>
        Insights
      </span>
    </nav>
  )
}
