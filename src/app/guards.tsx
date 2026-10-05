import { Navigate, Outlet } from 'react-router-dom'
import { Screen } from '../components/layout/Screen'
import { useDataContext } from './DataProvider'

function Message({ title, body }: { title: string; body: string }) {
  return (
    <Screen centered>
      <h1 className="type-title">{title}</h1>
      <p className="type-body text-text-secondary">{body}</p>
    </Screen>
  )
}

/** Shows loading, configuration and error states; renders children once the store has answered. */
export function Gate({ children }: { children: React.ReactNode }) {
  const { state } = useDataContext()
  if (state.status === 'unconfigured') {
    return <Message title="Not configured" body="This build has no Supabase settings. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY." />
  }
  if (state.status === 'loading') return <div className="min-h-dvh bg-bg-canvas" aria-busy="true" />
  if (state.status === 'error') return <Message title="Couldn't load your orders" body={state.message} />
  return <>{children}</>
}

/** Signed in, with or without a profile. */
export function RequireSession() {
  const { state } = useDataContext()
  if (state.status !== 'ready') return <Navigate to="/welcome" replace />
  return <Outlet />
}

/** Signed in and set up. */
export function RequireProfile() {
  const { state } = useDataContext()
  if (state.status !== 'ready') return <Navigate to="/welcome" replace />
  if (!state.profile) return <Navigate to="/setup/who" replace />
  return <Outlet />
}

/** "/" sends people to wherever they belong. */
export function RootRedirect() {
  const { state } = useDataContext()
  if (state.status !== 'ready') return <Navigate to="/welcome" replace />
  return <Navigate to={state.profile ? '/home' : '/setup/who'} replace />
}
