import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useI18n } from './i18n'
import * as store from './store'

export default function Account({ session }: { session: Session | null }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [state, setState] = useState<{
    kind: 'idle' | 'sending' | 'sent' | 'error'
    msg?: string
  }>({ kind: 'idle' })

  if (!store.supabase)
    return <span className="account muted">{t('account.local')}</span>

  if (session)
    return (
      <span className="account">
        <span className="muted">{session.user.email}</span>
        <button type="button" onClick={() => void store.signOut()}>
          {t('account.signOut')}
        </button>
      </span>
    )

  if (!open)
    return (
      <span className="account">
        <button type="button" onClick={() => setOpen(true)}>
          {t('account.signIn')}
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
        <span>{t('account.sent', { email })}</span>
      ) : (
        <>
          <input
            type="email"
            required
            placeholder={t('account.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label={t('account.email')}
            autoFocus
          />
          <button
            type="submit"
            className="primary"
            disabled={state.kind === 'sending'}
          >
            {state.kind === 'sending'
              ? t('account.sending')
              : t('account.send')}
          </button>
          <button type="button" className="link" onClick={() => setOpen(false)}>
            {t('account.cancel')}
          </button>
        </>
      )}
      {state.kind === 'error' && (
        <span className="error-text">{state.msg}</span>
      )}
    </form>
  )
}
