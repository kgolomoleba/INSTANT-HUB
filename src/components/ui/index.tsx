import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './ui.css'

/** Shared building blocks so every page looks and behaves the same. */

export function Page({ children }: { children: ReactNode }) {
  return <main className="ui-page">{children}</main>
}

export function PageHeader({ title, intro, actions }: { title: string; intro?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="ui-page-header">
      <div>
        <h1>{title}</h1>
        {intro && <p>{intro}</p>}
      </div>
      {actions && <div className="ui-actions">{actions}</div>}
    </header>
  )
}

export function Card({ title, sub, children, className = '' }: { title?: string; sub?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`ui-card ${className}`}>
      {title && <h2>{title}</h2>}
      {sub && <p className="ui-sub">{sub}</p>}
      {children}
    </section>
  )
}

type Variant = 'primary' | 'secondary' | 'danger' | 'link'
export function Button({ variant = 'secondary', small, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; small?: boolean }) {
  return <button type="button" className={`ui-btn ${variant === 'secondary' ? '' : variant} ${small ? 'small' : ''} ${className}`} {...rest} />
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'ok' | 'error'; children: ReactNode }) {
  return (
    <div className={`ui-notice ${tone === 'info' ? '' : tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="ui-empty">
      <h3>{title}</h3>
      {children}
    </div>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="ui-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  )
}

export function Loading({ text = 'Loading…' }: { text?: string }) {
  return (
    <div className="loading-state" aria-busy="true">
      <div className="loading-spinner" aria-hidden="true" />
      <p>{text}</p>
    </div>
  )
}
