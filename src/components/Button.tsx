import type { ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

// Figma: Components › Button (2:8)
// Primary for the one main action per screen. Secondary for supporting actions. Ghost for low-emphasis.

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-bg-brand text-text-on-brand',
  secondary: 'border-transparent bg-bg-brand-subtle text-text-brand',
  ghost: 'border-border-strong text-text-primary',
}

type Common = { variant?: ButtonVariant; fullWidth?: boolean }

export function buttonClass({ variant = 'primary', fullWidth = false }: Common = {}, extra = '') {
  return [
    'inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border px-xl py-md',
    'type-body-strong whitespace-nowrap transition-[opacity,transform] hover:opacity-90 active:scale-[0.98]',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
    VARIANTS[variant],
    fullWidth ? 'w-full' : 'shrink-0',
    extra,
  ].join(' ')
}

export function Button({ variant, fullWidth, className = '', type = 'button', ...rest }: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={buttonClass({ variant, fullWidth }, className)} {...rest} />
}

export function ButtonLink({ variant, fullWidth, className = '', ...rest }: Common & LinkProps) {
  return <Link className={buttonClass({ variant, fullWidth }, className)} {...rest} />
}
