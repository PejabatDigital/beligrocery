import { useNavigate } from 'react-router-dom'
import type { FormEvent } from 'react'
import { Button } from '../../components/Button'
import { Screen } from '../../components/layout/Screen'
import { TopBar } from '../../components/layout/TopBar'
import { TextField } from '../../components/TextField'
import { useSetupDraft } from './setupDraft'

// Figma: Setup › Who (4:14)
export function SetupWho() {
  const [draft, update] = useSetupDraft()
  const navigate = useNavigate()
  const name = draft.shopping_for.trim()

  function submit(e: FormEvent) {
    e.preventDefault()
    if (name) navigate('/setup/how-often')
  }

  return (
    <form onSubmit={submit}>
      <Screen
        footer={
          <Button type="submit" fullWidth disabled={!name}>
            Continue
          </Button>
        }
      >
        <TopBar subtitle="Step 1 of 3" title="Set up" backTo="/welcome" />
        <h2 className="type-title">Who are you shopping for?</h2>
        <TextField
          label="Their name"
          placeholder="e.g. Mum, Atuk, Uncle Ravi"
          autoComplete="off"
          autoCapitalize="words"
          maxLength={60}
          autoFocus
          value={draft.shopping_for}
          onChange={(e) => update({ shopping_for: e.target.value })}
          hint="Only you see this."
        />
      </Screen>
    </form>
  )
}
