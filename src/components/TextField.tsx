import { useId, type InputHTMLAttributes } from 'react'

type TextFieldProps = { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>

export const inputClass =
  'w-full rounded-md border border-border-strong bg-bg-surface px-lg py-[14px] type-body text-text-primary placeholder:text-text-secondary focus:border-border-brand focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-border-brand'

export function TextField({ label, hint, className = '', ...rest }: TextFieldProps) {
  const id = useId()
  return (
    <div className="flex flex-col gap-[6px]">
      <label htmlFor={id} className="type-caption text-text-secondary">
        {label}
      </label>
      <input id={id} className={`${inputClass} ${className}`} aria-describedby={hint ? `${id}-hint` : undefined} {...rest} />
      {hint && (
        <p id={`${id}-hint`} className="mt-[10px] type-caption text-text-secondary">
          {hint}
        </p>
      )}
    </div>
  )
}
