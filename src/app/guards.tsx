import { Navigate, Outlet } from 'react-router-dom'
import { Screen } from '../components/layout/Screen'
import { RestoreButton } from '../pages/settings/RestoreButton'
import { useDataContext } from './DataProvider'

/** Shows loading and error states; renders children once the data has loaded. */
export function Gate({ children }: { children: React.ReactNode }) {
  const { state } = useDataContext()
  if (state.status === 'loading') return <div className="min-h-dvh bg-bg-canvas" aria-busy="true" />
  if (state.status === 'error') {
    return (
      <Screen centered footer={<RestoreButton />}>
        <h1 className="type-title">Couldn't load your orders</h1>
        <p className="type-body text-text-secondary">{state.message}</p>
      </Screen>
    )
  }
  return <>{children}</>
}

/** Set up: has a profile. */
export function RequireProfile() {
  const { state } = useDataContext()
  if (state.status !== 'ready' || !state.profile) return <Navigate to="/welcome" replace />
  return <Outlet />
}

/** "/" sends you to wherever you belong. */
export function RootRedirect() {
  const { state } = useDataContext()
  if (state.status !== 'ready' || !state.profile) return <Navigate to="/welcome" replace />
  return <Navigate to="/home" replace />
}
