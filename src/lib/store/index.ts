import { createLocalStore } from './local'
import { createSupabaseStore } from './supabase'
import type { Store } from './types'

export type { Session, Snapshot, Store } from './types'

/** Supabase when configured; local mode only in development. */
export function createStore(): Store | null {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (url && key) return createSupabaseStore(url, key)
  if (import.meta.env.DEV) return createLocalStore()
  return null
}
