import type { ReactNode } from 'react'

// The 375-wide mobile frame from the wireframes: 56 top, 16 sides, 34 bottom, 16 between blocks.
// `footer` sticks to the bottom so the main action stays reachable on long lists.

type ScreenProps = {
  children: ReactNode
  footer?: ReactNode
  /** Centre the content vertically (Welcome, Reading, Saved). */
  centered?: boolean
  className?: string
  background?: 'canvas' | 'subtle'
}

export function Screen({ children, footer, centered = false, className = '', background = 'canvas' }: ScreenProps) {
  const bg = background === 'subtle' ? 'bg-bg-subtle' : 'bg-bg-canvas'
  return (
    <div className={`min-h-dvh ${bg}`}>
      <main
        className={`mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-lg px-lg pt-[max(56px,env(safe-area-inset-top))] ${footer ? '' : 'pb-[34px]'} ${className}`}
      >
        {centered ? <div className="flex flex-1 flex-col justify-center gap-lg">{children}</div> : children}
        {footer && (
          <div className={`sticky bottom-0 mt-auto flex flex-col gap-lg pt-md pb-[max(34px,env(safe-area-inset-bottom))] ${bg}`}>
            {footer}
          </div>
        )}
      </main>
    </div>
  )
}
