import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { OptionCard } from '../../components/OptionCard'
import { Screen } from '../../components/layout/Screen'
import { TopBar } from '../../components/layout/TopBar'
import { useDataContext } from '../../app/DataProvider'
import { clearSetupDraft, useSetupDraft } from './setupDraft'

// Figma: Setup › Past orders (4:49)
// Start fresh is the default. Bulk import is a post-v1 milestone, so it's shown as coming soon.
export function SetupPastOrders() {
  const [draft] = useSetupDraft()
  const { store, refresh } = useDataContext()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!draft.shopping_for.trim()) return <Navigate to="/setup/who" replace />

  async function finish() {
    if (!store) return
    setSaving(true)
    setError(null)
    try {
      await store.saveProfile({ shopping_for: draft.shopping_for.trim(), cadence_days: draft.cadence_days })
      await refresh()
      clearSetupDraft()
      navigate('/home', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save. Try again.")
      setSaving(false)
    }
  }

  return (
    <Screen
      footer={
        <>
          {error && (
            <p role="alert" className="type-caption text-text-accent">
              {error}
            </p>
          )}
          <Button fullWidth onClick={finish} disabled={saving}>
            {saving ? 'Saving…' : 'Continue'}
          </Button>
        </>
      }
    >
      <TopBar subtitle="Step 3 of 3" title="Set up" backTo="/setup/how-often" />
      <h2 className="type-title">Got past orders?</h2>
      <div role="radiogroup" aria-label="Past orders" className="flex flex-col gap-lg">
        <OptionCard
          size="large"
          selected
          onSelect={() => {}}
          title="Start fresh"
          description="Begin with your next order. Predictions unlock after 6 orders."
        />
        <OptionCard
          size="large"
          selected={false}
          disabled
          onSelect={() => {}}
          eyebrow="Coming soon"
          title="Import past orders"
          description="Paste your old WhatsApp lists. With 6 or more, predictions start right away."
        />
      </div>
    </Screen>
  )
}
