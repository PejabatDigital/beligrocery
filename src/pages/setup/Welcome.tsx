import { Navigate } from 'react-router-dom'
import { ButtonLink } from '../../components/Button'
import { Screen } from '../../components/layout/Screen'
import { useDataContext } from '../../app/DataProvider'
import { RestoreButton } from '../settings/RestoreButton'

// Figma: Setup › Welcome (4:4)
// Not in Figma: "Restore from a backup", for moving to a new phone or browser.
export function Welcome() {
  const { state } = useDataContext()
  if (state.status === 'ready' && state.profile) return <Navigate to="/home" replace />

  return (
    <Screen
      footer={
        <>
          <ButtonLink to="/setup/who" fullWidth>
            Get started
          </ButtonLink>
          <RestoreButton variant="ghost" />
          <p className="type-caption text-text-secondary">Takes about a minute to set up. Everything stays on this device.</p>
        </>
      }
    >
      <div className="flex flex-1 flex-col items-start justify-center gap-lg">
        <div aria-hidden="true" className="rounded-lg bg-bg-brand-subtle px-[20px] py-[18px] type-title text-text-brand">
          BG
        </div>
        <p className="type-heading text-text-brand">Beli Grocery</p>
        <h1 className="type-display text-text-primary">Groceries for someone you care about, from anywhere.</h1>
        <p className="type-body text-text-secondary">
          Log their orders, let the app learn the pattern, and get the next list ready before order day.
        </p>
      </div>
    </Screen>
  )
}
