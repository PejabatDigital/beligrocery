import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createStore, type Session, type Snapshot, type Store } from '../lib/store'

type DataState =
  | { status: 'unconfigured' }
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'error'; message: string }
  | ({ status: 'ready'; session: Session } & Snapshot)

type DataContextValue = { state: DataState; store: Store | null; refresh: () => Promise<void> }

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createStore)
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [state, setState] = useState<DataState>(store ? { status: 'loading' } : { status: 'unconfigured' })

  useEffect(() => {
    if (!store) return
    store.getSession().then(setSession)
    return store.onSessionChange(setSession)
  }, [store])

  const load = useCallback(
    async (current: Session) => {
      if (!store) return
      try {
        const snapshot = await store.load()
        setState({ status: 'ready', session: current, ...snapshot })
      } catch (e) {
        setState({ status: 'error', message: e instanceof Error ? e.message : 'Something went wrong' })
      }
    },
    [store],
  )

  const userId = session?.userId
  useEffect(() => {
    if (session === undefined) return
    if (session === null) setState({ status: 'signed-out' })
    else load(session)
    // Reload only when the signed-in user changes, not on token refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, session === null, load])

  const refresh = useCallback(async () => {
    if (session) await load(session)
  }, [session, load])

  const value = useMemo(() => ({ state, store, refresh }), [state, store, refresh])
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useDataContext() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useDataContext outside DataProvider')
  return ctx
}
