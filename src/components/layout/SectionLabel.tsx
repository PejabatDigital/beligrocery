import type { ReactNode } from 'react'

const TONES = {
  secondary: 'text-text-secondary',
  brand: 'text-text-brand',
  warning: 'text-text-warning',
}

export function SectionLabel({ children, tone = 'secondary' }: { children: ReactNode; tone?: keyof typeof TONES }) {
  return <h2 className={`type-label ${TONES[tone]}`}>{children}</h2>
}
