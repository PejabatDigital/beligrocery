import { useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDataContext } from '../../app/DataProvider'
import { Button, type ButtonVariant } from '../../components/Button'

/** Pick a backup file and replace everything on this device with it. */
export function RestoreButton({ variant = 'secondary' }: { variant?: ButtonVariant }) {
  const { state, store, refresh } = useDataContext()
  const navigate = useNavigate()
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function restore(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const hasData = state.status === 'ready' && (state.profile || state.orders.length > 0)
    if (hasData && !window.confirm('Replace everything on this device with this backup?')) return
    setBusy(true)
    setError(null)
    try {
      await store.restoreBackup(await file.text())
      await refresh()
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't restore that file.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <input ref={input} type="file" accept="application/json,.json" className="hidden" onChange={restore} />
      <Button variant={variant} fullWidth disabled={busy} onClick={() => input.current?.click()}>
        {busy ? 'Restoring…' : 'Restore from a backup'}
      </Button>
      {error && (
        <p role="alert" className="type-caption text-text-accent">
          {error}
        </p>
      )}
    </>
  )
}
