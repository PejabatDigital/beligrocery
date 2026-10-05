import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../../app/useAppData'
import { Button } from '../../components/Button'
import { Screen } from '../../components/layout/Screen'
import { SectionLabel } from '../../components/layout/SectionLabel'
import { TopBar } from '../../components/layout/TopBar'
import { useToast } from '../../components/Toast'
import { saveBackupFile } from '../../lib/backup'
import { formatDate, todayISO } from '../../lib/dates'
import { plural } from '../../lib/format'
import { RestoreButton } from './RestoreButton'

// Not in Figma: data lives only on this device, so backups need a home. Styled like the Setup steps.
export function Settings() {
  const { store, refresh, orders } = useAppData()
  const navigate = useNavigate()
  const { show, toast } = useToast()
  const [lastBackup, setLastBackup] = useState(store.lastBackupAt)

  async function backup() {
    try {
      if (await saveBackupFile(await store.exportBackup())) {
        setLastBackup(store.lastBackupAt())
        show('Backup saved')
      }
    } catch (e) {
      show(e instanceof Error ? e.message : "Couldn't make a backup")
    }
  }

  async function erase() {
    if (!window.confirm(`Erase all ${plural(orders.length, 'order')} from this device? This can't be undone.`)) return
    await store.eraseAll()
    await refresh()
    navigate('/welcome', { replace: true })
  }

  return (
    <Screen>
      <TopBar title="Settings" />

      <section className="flex flex-col gap-md">
        <SectionLabel>Backup</SectionLabel>
        <p className="type-body text-text-secondary">
          Your orders are saved on this device only. Save a backup now and then, so nothing is lost if you clear the
          browser or change phones.
        </p>
        <p className="type-caption text-text-secondary">
          Last backup: {lastBackup ? formatDate(todayISO(new Date(lastBackup))) : 'never'}
        </p>
        <Button fullWidth onClick={backup}>
          Save a backup
        </Button>
        <RestoreButton />
      </section>

      <section className="flex flex-col gap-md">
        <SectionLabel>Start over</SectionLabel>
        <Button variant="ghost" fullWidth onClick={erase}>
          Erase everything
        </Button>
      </section>
      {toast}
    </Screen>
  )
}
