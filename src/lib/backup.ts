import { todayISO } from './dates'

export function backupFileName(today = todayISO()) {
  return `beli-grocery-backup-${today}.json`
}

/**
 * Hand the backup to the user: the share sheet where there is one (so it can go to Files, Drive
 * or WhatsApp on a phone), otherwise a normal download. Returns false if they cancelled sharing.
 */
export async function saveBackupFile(json: string): Promise<boolean> {
  const name = backupFileName()
  const file = new File([json], name, { type: 'application/json' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name })
      return true
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return false
      // Sharing failed for another reason: fall back to downloading.
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return true
}
