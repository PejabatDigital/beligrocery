import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { requestPersistentStorage, store, type Snapshot, type Store } from '../lib/store'

type DataState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | ({ status: 'ready' } & Snapshot)

type DataContextValue = { state: DataState; store: Store; refresh: () => Promise<void> }

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>({ status: 'loading' })

  const refresh = useCallback(async () => {
    try {
      setState({ status: 'ready', ...(await store.load()) })
    } catch (e) {
      setState({ status: 'error', message: e instanceof Error ? e.message : 'Something went wrong' })
    }
  }, [])

  useEffect(() => {
    refresh()
    requestPersistentStorage()
  }, [refresh])

  const value = useMemo(() => ({ state, store, refresh }), [state, refresh])
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useDataContext() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useDataContext outside DataProvider')
  return ctx
}
