import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Screen } from '../../components/layout/Screen'
import { TopBar } from '../../components/layout/TopBar'
import { TextField } from '../../components/TextField'
import { useDataContext } from '../../app/DataProvider'

// Not in Figma: magic-link sign-in between Welcome and Setup, styled like the Setup steps.
export function SignIn() {
  const { state, store } = useDataContext()
  const [email, setEmail] = useState('')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const local = store?.mode === 'local'

  if (state.status === 'ready') return <Navigate to="/" replace />

  const valid = local || /^\S+@\S+\.\S+$/.test(email.trim())
  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!store || !valid) return
    setSending(true)
    setError(null)
    try {
      await store.sendMagicLink(email.trim())
      setSentTo(email.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the link. Try again.")
    } finally {
      setSending(false)
    }
  }

  if (sentTo && !local) {
    return (
      <Screen
        footer={
          <Button variant="ghost" fullWidth onClick={() => setSentTo(null)}>
            Use a different email
          </Button>
        }
      >
        <TopBar title="Sign in" backTo="/welcome" />
        <h2 className="type-title">Check your email</h2>
        <p className="type-body text-text-secondary">
          We sent a sign-in link to <span className="font-semibold text-text-primary">{sentTo}</span>. Open it on this
          device to carry on.
        </p>
      </Screen>
    )
  }

  return (
    <form onSubmit={submit}>
      <Screen
        footer={
          <Button type="submit" fullWidth disabled={!valid || sending}>
            {local ? 'Continue' : sending ? 'Sending…' : 'Send link'}
          </Button>
        }
      >
        <TopBar title="Sign in" backTo="/welcome" />
        <h2 className="type-title">What's your email?</h2>
        <TextField
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          hint={local ? 'Local mode: no email is sent. Continue to sign in on this browser.' : "We'll email you a link. No password needed."}
        />
        {error && (
          <p role="alert" className="type-caption text-text-accent">
            {error}
          </p>
        )}
      </Screen>
    </form>
  )
}
