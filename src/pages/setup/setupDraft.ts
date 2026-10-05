import { useCallback, useState } from 'react'

// Answers carried across the three Setup steps until they're saved on the last one.

export type SetupDraft = { shopping_for: string; cadence_days: number; cadence_choice: CadenceChoice }
export type CadenceChoice = 'week' | 'fortnight' | 'month' | 'varies'

export const CADENCE_OPTIONS: { choice: CadenceChoice; label: string; days: number }[] = [
  { choice: 'week', label: 'Every week', days: 7 },
  { choice: 'fortnight', label: 'Every 2 weeks', days: 14 },
  { choice: 'month', label: 'Every month', days: 30 },
  // Until the real rhythm is learned, "it varies" works like the default fortnight.
  { choice: 'varies', label: 'It varies', days: 14 },
]

const KEY = 'beli-grocery:setup'
const DEFAULT: SetupDraft = { shopping_for: '', cadence_days: 14, cadence_choice: 'fortnight' }

function read(): SetupDraft {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT
  } catch {
    return DEFAULT
  }
}

export function useSetupDraft() {
  const [draft, setDraft] = useState<SetupDraft>(read)
  const update = useCallback((patch: Partial<SetupDraft>) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch }
      try {
        sessionStorage.setItem(KEY, JSON.stringify(next))
      } catch {
        // Session storage unavailable: the draft just won't survive a reload.
      }
      return next
    })
  }, [])
  return [draft, update] as const
}

export function clearSetupDraft() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
