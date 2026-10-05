import { useState, type ReactNode } from 'react'
import { Button } from '../components/Button'
import { CategoryChip } from '../components/CategoryChip'
import { ItemRow } from '../components/ItemRow'
import { ProgressCard } from '../components/ProgressCard'
import { StatCard } from '../components/StatCard'
import { Toggle } from '../components/Toggle'
import { CATEGORIES } from '../lib/categories'

// Dev-only reference page: every token and component, for checking against Figma.

const BG_TOKENS = [
  'canvas',
  'surface',
  'subtle',
  'brand',
  'brand-subtle',
  'accent',
  'accent-subtle',
  'warning-subtle',
  'info-subtle',
]
const TEXT_TOKENS = ['primary', 'secondary', 'brand', 'accent', 'warning', 'info']
const BORDER_TOKENS = ['default', 'strong', 'brand']

const TYPE_STYLES = [
  ['type-display', 'Display · Fraunces 600 32/38'],
  ['type-title', 'Title · Fraunces 600 24/30'],
  ['type-heading', 'Heading · Jakarta 700 18/24'],
  ['type-body', 'Body · Jakarta 400 15/22'],
  ['type-body-strong', 'Body Strong · Jakarta 600 15/22'],
  ['type-caption', 'Caption · Jakarta 500 13/18'],
  ['type-label', 'Label · Jakarta 700 12/16'],
  ['type-number', 'Number · Jakarta 800 28/32'],
] as const

const SPACING = [
  ['xs', 4],
  ['sm', 8],
  ['md', 12],
  ['lg', 16],
  ['xl', 24],
  ['2xl', 32],
  ['3xl', 48],
] as const

const RADII = [
  ['sm', 'rounded-sm'],
  ['md', 'rounded-md'],
  ['lg', 'rounded-lg'],
  ['full', 'rounded-full'],
] as const

function Section({ title, node, children }: { title: string; node?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-md">
      <div className="flex items-baseline justify-between gap-sm">
        <h2 className="type-heading">{title}</h2>
        {node && <span className="type-caption text-text-secondary">Figma {node}</span>}
      </div>
      {children}
    </section>
  )
}

function Swatch({ name, varName }: { name: string; varName: string }) {
  return (
    <div className="flex flex-col gap-xs">
      <div
        className="h-12 rounded-sm border border-border-default"
        style={{ backgroundColor: `var(${varName})` }}
      />
      <span className="type-caption text-text-secondary">{name}</span>
    </div>
  )
}

// Sample content for this reference page only. The app itself shows the user's own data.
export function DevComponents() {
  const [on, setOn] = useState(true)
  const [off, setOff] = useState(false)
  const [picked, setPicked] = useState<(typeof CATEGORIES)[number] | null>(null)
  return (
    <main className="mx-auto flex max-w-[375px] flex-col gap-2xl px-lg py-2xl">
      <header className="flex flex-col gap-xs">
        <span className="type-label text-text-secondary">Dev</span>
        <h1 className="type-title">Components</h1>
      </header>

      <Section title="Button" node="2:8">
        <div className="flex flex-col gap-md">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      <Section title="Toggle" node="2:13">
        <div className="flex gap-xl">
          <Toggle checked={on} onChange={setOn} label="On example" />
          <Toggle checked={off} onChange={setOff} label="Off example" />
        </div>
      </Section>

      <Section title="Category Chip" node="2:26">
        <div className="flex flex-wrap gap-sm">
          {CATEGORIES.map((c) => (
            <CategoryChip key={c} category={c} />
          ))}
        </div>
        <span className="type-caption text-text-secondary">As a choice</span>
        <div className="flex flex-wrap gap-sm">
          {CATEGORIES.map((c) => (
            <CategoryChip
              key={c}
              category={c}
              selected={picked == null ? undefined : picked === c}
              onClick={() => setPicked(c)}
            />
          ))}
        </div>
      </Section>

      <Section title="Item Row" node="2:38">
        <ItemRow name="Item name" meta="2 tin · every 4 weeks" trailing="× 2" />
        <ItemRow mode="draft" name="Item name" meta="2 tin · every 4 weeks" checked={on} onCheckedChange={setOn} />
      </Section>

      <Section title="Stat Card" node="2:39">
        <div className="flex gap-md">
          <StatCard label="Label" value="RM 372" note="2 orders" />
          <StatCard label="Label" value="26 Sep" note="7 days ago" />
        </div>
      </Section>

      <Section title="Progress Card" node="2:43">
        <ProgressCard filled={3} total={6} title="3 of 6 orders logged" body="Predictions unlock at 6. 3 more orders to go." />
      </Section>

      <hr className="border-border-default" />

      <Section title="Colour · bg">
        <div className="grid grid-cols-3 gap-md">
          {BG_TOKENS.map((t) => (
            <Swatch key={t} name={t} varName={`--color-bg-${t}`} />
          ))}
        </div>
      </Section>

      <Section title="Colour · category">
        <div className="grid grid-cols-4 gap-md">
          {CATEGORIES.map((t) => (
            <Swatch key={t} name={t} varName={`--color-category-${t}`} />
          ))}
        </div>
      </Section>

      <Section title="Colour · text">
        <div className="flex flex-wrap gap-x-lg gap-y-xs">
          {TEXT_TOKENS.map((t) => (
            <span key={t} className="type-body-strong" style={{ color: `var(--color-text-${t})` }}>
              {t}
            </span>
          ))}
          <span className="rounded-sm bg-bg-brand px-sm type-body-strong text-text-on-brand">
            on-brand
          </span>
        </div>
      </Section>

      <Section title="Colour · border">
        <div className="grid grid-cols-3 gap-md">
          {BORDER_TOKENS.map((t) => (
            <div key={t} className="flex flex-col gap-xs">
              <div
                className="h-12 rounded-sm border-2 bg-bg-surface"
                style={{ borderColor: `var(--color-border-${t})` }}
              />
              <span className="type-caption text-text-secondary">{t}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Type">
        <div className="flex flex-col gap-lg">
          {TYPE_STYLES.map(([cls, spec]) => (
            <div key={cls} className="flex flex-col gap-xs">
              <span className="type-caption text-text-secondary">{spec}</span>
              <span className={cls}>The quick brown fox</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Spacing">
        <div className="flex items-end gap-lg">
          {SPACING.map(([name, px]) => (
            <div key={name} className="flex flex-col items-center gap-xs">
              <div className="rounded-[2px] bg-bg-brand" style={{ width: px, height: px }} />
              <span className="type-caption text-text-secondary">{name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Radius">
        <div className="flex gap-lg">
          {RADII.map(([name, cls]) => (
            <div key={name} className="flex flex-col items-center gap-xs">
              <div className={`size-14 border-2 border-border-brand bg-bg-brand-subtle ${cls}`} />
              <span className="type-caption text-text-secondary">{name}</span>
            </div>
          ))}
        </div>
      </Section>
    </main>
  )
}
