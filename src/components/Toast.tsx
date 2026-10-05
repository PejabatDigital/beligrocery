import { useCallback, useEffect, useRef, useState } from 'react'

/** A short confirmation that fades after a moment, e.g. "Copied". */
export function useToast(duration = 2000) {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const show = useCallback(
    (text: string) => {
      window.clearTimeout(timer.current)
      setMessage(text)
      timer.current = window.setTimeout(() => setMessage(null), duration)
    },
    [duration],
  )
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const toast = (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[110px] flex justify-center px-lg">
      {message && (
        <span className="rounded-full bg-text-primary px-lg py-sm type-body-strong text-text-on-brand shadow-lg">{message}</span>
      )}
    </div>
  )
  return { show, toast }
}
