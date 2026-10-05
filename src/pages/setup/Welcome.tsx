import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Screen } from '../../components/layout/Screen'
import { useDataContext } from '../../app/DataProvider'

// Figma: Setup › Welcome (4:4)
export function Welcome() {
  const { state, store } = useDataContext()
  const navigate = useNavigate()
  if (state.status === 'ready' && state.profile) return <Navigate to="/home" replace />

  return (
    <Screen
      footer={
        <>
          <Button fullWidth onClick={() => navigate(state.status === 'ready' ? '/setup/who' : '/sign-in')}>
            Get started
          </Button>
          <p className="type-caption text-text-secondary">
            Takes about a minute to set up.
            {store?.mode === 'local' && ' Local mode: your data stays in this browser.'}
          </p>
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
