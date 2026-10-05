import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { OptionCard } from '../../components/OptionCard'
import { Screen } from '../../components/layout/Screen'
import { TopBar } from '../../components/layout/TopBar'
import { CADENCE_OPTIONS, useSetupDraft } from './setupDraft'

// Figma: Setup › How often (4:29)
export function SetupHowOften() {
  const [draft, update] = useSetupDraft()
  const navigate = useNavigate()
  if (!draft.shopping_for.trim()) return <Navigate to="/setup/who" replace />

  return (
    <Screen
      footer={
        <Button fullWidth onClick={() => navigate('/setup/past-orders')}>
          Continue
        </Button>
      }
    >
      <TopBar subtitle="Step 2 of 3" title="Set up" backTo="/setup/who" />
      <h2 className="type-title">How often do you order?</h2>
      <div role="radiogroup" aria-label="How often" className="flex flex-col gap-lg">
        {CADENCE_OPTIONS.map((o) => (
          <OptionCard
            key={o.choice}
            title={o.label}
            selected={draft.cadence_choice === o.choice}
            onSelect={() => update({ cadence_choice: o.choice, cadence_days: o.days })}
          />
        ))}
      </div>
      <p className="type-caption text-text-secondary">We'll use this until we learn the real rhythm from your orders.</p>
    </Screen>
  )
}
