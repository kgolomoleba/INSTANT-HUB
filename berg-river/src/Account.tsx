import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import * as store from './store'

export default function Account({ session }: { session: Session | null }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [state, setState] = useState<{
    kind: 'idle' | 'sending' | 'sent' | 'error'
    msg?: string
  }>({ kind: 'idle' })

  if (!store.supabase)
    return (
      <span className="account muted">Farms are saved in this browser</span>
    )

  if (session)
    return (
      <span className="account">
        <span className="muted">{session.user.email}</span>
        <button type="button" onClick={() => void store.signOut()}>
          Sign out
        </button>
      </span>
    )

  if (!open)
    return (
      <span className="account">
        <button type="button" onClick={() => setOpen(true)}>
          Sign in to save farms
        </button>
      </span>
    )

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    setState({ kind: 'sending' })
    try {
      await store.sendSignInLink(email.trim())
      setState({ kind: 'sent' })
    } catch (err) {
      setState({
        kind: 'error',
        msg: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return (
    <form className="account signin" onSubmit={send}>
      {state.kind === 'sent' ? (
        <span>Check {email} for a sign-in link.</span>
      ) : (
        <>
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email address"
            autoFocus
          />
          <button type="submit" disabled={state.kind === 'sending'}>
            {state.kind === 'sending' ? 'Sending…' : 'Email me a link'}
          </button>
          <button type="button" className="link" onClick={() => setOpen(false)}>
            Cancel
          </button>
        </>
      )}
      {state.kind === 'error' && (
        <span className="error-text">{state.msg}</span>
      )}
    </form>
  )
}
