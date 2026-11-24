import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import FinanceReport from '../components/finance/FinanceReport'
import { Button, Card, EmptyState, Field, Loading, Notice, Page, PageHeader } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { errorMessage } from '../utils/errors'
import { monthLabel, parseBankCsv, rand, summarize, type CsvMonth, type FinMonth } from '../utils/finance'
import * as api from '../utils/financeApi'

const thisMonth = () => new Date().toISOString().slice(0, 7)
const DURATIONS = [
  { days: 7, label: '1 week' },
  { days: 30, label: '1 month' },
  { days: 90, label: '3 months' },
  { days: 365, label: '1 year' },
]
const date = (s: string | null) => (s ? new Date(s).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : '')

export default function FinancePage() {
  const { user } = useAuth()
  const [months, setMonths] = useState<FinMonth[] | null>(null)
  const [links, setLinks] = useState<api.ShareLink[]>([])
  const [grants, setGrants] = useState<api.Grant[]>([])
  const [shared, setShared] = useState<Awaited<ReturnType<typeof api.sharedWithMe>>>([])
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [m, l, g, s] = await Promise.all([api.listMonths(), api.listLinks(), api.listGrants(), api.sharedWithMe()])
      setMonths(m)
      setLinks(l)
      setGrants(g)
      setShared(s)
      setLoadError(null)
    } catch (e) {
      setLoadError(errorMessage(e, "Couldn't load your figures."))
    }
  }, [])
  useEffect(() => {
    void load()
  }, [load])

  const act = async (fn: () => Promise<void>, ok: string) => {
    setNotice(null)
    try {
      await fn()
      setNotice({ tone: 'ok', text: ok })
      await load()
    } catch (e) {
      setNotice({ tone: 'error', text: errorMessage(e, 'That did not work. Please try again.') })
    }
  }

  if (loadError)
    return (
      <Page>
        <PageHeader title="Finances" />
        <Notice tone="error">
          {loadError} If this keeps happening, the financial tracker may not be set up in the database yet.
        </Notice>
      </Page>
    )
  if (!months) return <Page><Loading text="Loading your figures…" /></Page>

  return (
    <Page>
      <PageHeader
        title="Finances"
        intro="Keep track of money in and out each month, see how healthy your business is, and share a report with funders or partners you choose."
      />
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

      {months.length ? (
        <FinanceReport summary={summarize(months)} months={months} />
      ) : (
        <EmptyState title="No figures yet">
          <p>Add your first month below, or upload a bank statement and we'll add up the months for you.</p>
        </EmptyState>
      )}

      <div className="fin-two">
        <MonthForm
          existing={months}
          onSave={(m) => act(() => api.saveMonths(user!.id, [m]), `Saved ${monthLabel(m.month)}.`)}
        />
        <CsvImport onSave={(ms) => act(() => api.saveMonths(user!.id, ms), `Added ${ms.length} month${ms.length === 1 ? '' : 's'} from your bank statement.`)} />
      </div>

      {months.length > 0 && (
        <Card title="Your months" sub="Tap a month to change it above. Months from a bank statement can be replaced by uploading again.">
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th className="num">Money in</th>
                  <th className="num">Money out</th>
                  <th className="num">Cash</th>
                  <th>Source</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {[...months].reverse().map((m) => (
                  <tr key={m.month}>
                    <td>{monthLabel(m.month)}</td>
                    <td className="num">{rand(m.income)}</td>
                    <td className="num">{rand(m.expenses)}</td>
                    <td className="num">{m.cash_balance == null ? '—' : rand(m.cash_balance)}</td>
                    <td>{m.source === 'bank_csv' ? 'Bank statement' : m.source === 'accounting' ? 'Accounting' : 'Typed in'}</td>
                    <td className="num">
                      <Button
                        small
                        variant="danger"
                        onClick={() => window.confirm(`Delete ${monthLabel(m.month)}?`) && act(() => api.deleteMonth(m.id!), `Deleted ${monthLabel(m.month)}.`)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="fin-two">
        <LinkSharing links={links} onCreate={(l, s, d) => act(() => api.createLink(l, s, d), `Link for "${l}" created. Copy it below.`)} onRevoke={(id) => act(() => api.revokeLink(id), 'Link switched off.')} />
        <UserSharing grants={grants} onGrant={(u, s, d) => act(() => api.grantAccess(u, s, d), `Shared with ${u}.`)} onRevoke={(id) => act(() => api.revokeGrant(id), 'Access removed.')} />
      </div>

      {shared.length > 0 && (
        <Card title="Shared with me" sub="Businesses that have shared their financial health with you.">
          {shared.map((s) => (
            <div key={s.owner_id} className="fin-share-row">
              <div>
                <b>{s.business}</b>
                <div className="meta">
                  {s.scope === 'monthly' ? 'Month-by-month figures' : 'Summary'} · until {date(s.expires_at)}
                </div>
              </div>
              <Link className="ui-btn small primary" to={`/finance/shared/${s.owner_id}`}>
                View report
              </Link>
            </div>
          ))}
        </Card>
      )}

      <Card title="Connect accounting software" sub="Figures straight from your accounting package are the most trusted by funders.">
        <div className="fin-coming">
          <span className="ui-badge">Xero: coming soon</span>
          <span className="ui-badge">Sage: coming soon</span>
          <span className="ui-badge">QuickBooks: coming soon</span>
        </div>
      </Card>

      <Card title="Your privacy">
        <p style={{ color: 'var(--gray)', margin: '0 0 0.75rem' }}>
          Only you can see these figures, unless you share a report. You choose what each report shows and for how long, and can switch it off at any time. Each view is counted. Bank statements are read on your device: only the monthly totals are saved, never individual transactions.
        </p>
        <Button
          variant="danger"
          onClick={() =>
            window.confirm('Delete all your financial figures and switch off every shared report? This cannot be undone.') &&
            act(() => api.deleteAllFinance(), 'All your financial data was deleted.')
          }
        >
          Delete all my financial data
        </Button>
      </Card>
    </Page>
  )
}

function MonthForm({ existing, onSave }: { existing: FinMonth[]; onSave: (m: FinMonth) => void }) {
  const [month, setMonth] = useState(thisMonth())
  const [income, setIncome] = useState('')
  const [expenses, setExpenses] = useState('')
  const [cash, setCash] = useState('')
  const [debt, setDebt] = useState('')
  const current = existing.find((m) => m.month.startsWith(month))

  // Fill in the form when picking a month that already has figures.
  useEffect(() => {
    setIncome(current ? String(current.income) : '')
    setExpenses(current ? String(current.expenses) : '')
    setCash(current?.cash_balance == null ? '' : String(current.cash_balance))
    setDebt(current?.debt == null ? '' : String(current.debt))
  }, [month, current])

  const n = (s: string) => (s.trim() === '' ? null : Math.round(Number(s.replace(/[\s,R]/g, '')) * 100) / 100)
  return (
    <Card title={current ? `Change ${monthLabel(current.month)}` : 'Add a month'} sub="Totals for the whole month, in rand.">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSave({ month: `${month}-01`, income: n(income) ?? 0, expenses: n(expenses) ?? 0, cash_balance: n(cash), debt: n(debt), source: 'manual' })
        }}
      >
        <div className="ui-grid">
          <Field label="Month">
            <input type="month" required value={month} max={thisMonth()} min="2000-01" onChange={(e) => setMonth(e.target.value)} />
          </Field>
          <Field label="Money in (sales, income)">
            <input inputMode="decimal" required value={income} onChange={(e) => setIncome(e.target.value)} placeholder="e.g. 35000" />
          </Field>
          <Field label="Money out (all costs)">
            <input inputMode="decimal" required value={expenses} onChange={(e) => setExpenses(e.target.value)} placeholder="e.g. 28000" />
          </Field>
          <Field label="Cash in the bank at month end" hint="Optional: shows how long your cash would last">
            <input inputMode="decimal" value={cash} onChange={(e) => setCash(e.target.value)} placeholder="optional" />
          </Field>
          <Field label="Money owed (loans, credit)" hint="Optional">
            <input inputMode="decimal" value={debt} onChange={(e) => setDebt(e.target.value)} placeholder="optional" />
          </Field>
        </div>
        <div style={{ marginTop: '0.9rem' }}>
          <Button type="submit" variant="primary">
            {current ? 'Save changes' : 'Add month'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

function CsvImport({ onSave }: { onSave: (ms: FinMonth[]) => void }) {
  const [preview, setPreview] = useState<CsvMonth[] | null>(null)
  const [skipped, setSkipped] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const read = async (file?: File) => {
    setError(null)
    setPreview(null)
    if (!file) return
    if (file.size > 10 * 1024 * 1024) return setError('That file is too large (over 10 MB).')
    try {
      const r = parseBankCsv(await file.text())
      setPreview(r.months)
      setSkipped(r.skipped)
    } catch (e) {
      setError(errorMessage(e, "Couldn't read that file.") + ' Download the statement from your bank as CSV and try again.')
    }
  }

  return (
    <Card title="Upload a bank statement" sub="Download a CSV statement from your bank's website or app. We add up each month on your device and only save the totals.">
      <Field label="Statement file (CSV)">
        <input type="file" accept=".csv,text/csv" onChange={(e) => void read(e.target.files?.[0])} />
      </Field>
      {error && <Notice tone="error">{error}</Notice>}
      {preview && (
        <div className="fin-csv-preview">
          <Notice>
            Found {preview.length} month{preview.length === 1 ? '' : 's'}
            {skipped ? ` (${skipped} line${skipped === 1 ? '' : 's'} skipped)` : ''}. Check them, then save. Transfers between your own accounts count as money in or out, so adjust those months by hand if needed.
          </Notice>
          <div className="ui-table-wrap" style={{ marginTop: '0.6rem' }}>
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th className="num">Money in</th>
                  <th className="num">Money out</th>
                  <th className="num">Cash</th>
                  <th className="num">Lines</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((m) => (
                  <tr key={m.month}>
                    <td>{monthLabel(m.month)}</td>
                    <td className="num">{rand(m.income)}</td>
                    <td className="num">{rand(m.expenses)}</td>
                    <td className="num">{m.cash_balance == null ? '—' : rand(m.cash_balance)}</td>
                    <td className="num">{m.transactions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            <Button
              variant="primary"
              onClick={() => {
                onSave(preview.map((m) => ({ month: m.month, income: m.income, expenses: m.expenses, cash_balance: m.cash_balance, debt: null, source: 'bank_csv' })))
                setPreview(null)
              }}
            >
              Save these months
            </Button>
            <Button onClick={() => setPreview(null)}>Cancel</Button>
          </div>
        </div>
      )}
    </Card>
  )
}

function ShareOptions({ scope, setScope, days, setDays }: { scope: 'summary' | 'monthly'; setScope: (s: 'summary' | 'monthly') => void; days: number; setDays: (d: number) => void }) {
  return (
    <>
      <Field label="What they can see">
        <select value={scope} onChange={(e) => setScope(e.target.value as 'summary' | 'monthly')}>
          <option value="summary">Summary only (health, totals)</option>
          <option value="monthly">Summary and month-by-month figures</option>
        </select>
      </Field>
      <Field label="For how long">
        <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
          {DURATIONS.map((d) => (
            <option key={d.days} value={d.days}>
              {d.label}
            </option>
          ))}
        </select>
      </Field>
    </>
  )
}

function LinkSharing({ links, onCreate, onRevoke }: { links: api.ShareLink[]; onCreate: (label: string, scope: 'summary' | 'monthly', days: number) => void; onRevoke: (id: string) => void }) {
  const [label, setLabel] = useState('')
  const [scope, setScope] = useState<'summary' | 'monthly'>('summary')
  const [days, setDays] = useState(30)
  const [copied, setCopied] = useState<string | null>(null)
  const active = (l: api.ShareLink) => !l.revoked_at && new Date(l.expires_at) > new Date()

  return (
    <Card title="Share with a link" sub="For a funder or partner without an Instant Hub account. Anyone with the link can open the report until it expires or you switch it off.">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (label.trim()) onCreate(label.trim(), scope, days)
          setLabel('')
        }}
      >
        <div className="ui-grid">
          <Field label="Who is it for?">
            <input required maxLength={80} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Small business loan, Bank X" />
          </Field>
          <ShareOptions scope={scope} setScope={setScope} days={days} setDays={setDays} />
        </div>
        <p className="fin-disclaimer" style={{ margin: '0.6rem 0' }}>
          By creating a link you agree to share these figures with whoever you send it to.
        </p>
        <Button type="submit" variant="primary">
          Create link
        </Button>
      </form>
      {links.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          {links.map((l) => (
            <div key={l.id} className={`fin-share-row ${active(l) ? '' : 'off'}`}>
              <div>
                <b>{l.label}</b>
                <div className="meta">
                  {l.scope === 'monthly' ? 'Month by month' : 'Summary'} ·{' '}
                  {l.revoked_at ? 'switched off' : new Date(l.expires_at) < new Date() ? `expired ${date(l.expires_at)}` : `until ${date(l.expires_at)}`} · viewed {l.view_count}{' '}
                  {l.view_count === 1 ? 'time' : 'times'}
                  {l.last_viewed_at ? `, last on ${date(l.last_viewed_at)}` : ''}
                </div>
              </div>
              {active(l) && (
                <div className="actions">
                  <Button
                    small
                    variant="primary"
                    onClick={async () => {
                      await navigator.clipboard.writeText(api.shareUrl(l.token)).catch(() => window.prompt('Copy this link:', api.shareUrl(l.token)))
                      setCopied(l.id)
                      setTimeout(() => setCopied(null), 2000)
                    }}
                  >
                    {copied === l.id ? 'Copied' : 'Copy link'}
                  </Button>
                  <Button small variant="danger" onClick={() => onRevoke(l.id)}>
                    Switch off
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function UserSharing({ grants, onGrant, onRevoke }: { grants: api.Grant[]; onGrant: (username: string, scope: 'summary' | 'monthly', days: number) => void; onRevoke: (id: string) => void }) {
  const [username, setUsername] = useState('')
  const [scope, setScope] = useState<'summary' | 'monthly'>('summary')
  const [days, setDays] = useState(90)
  const active = (g: api.Grant) => !g.revoked_at && new Date(g.expires_at) > new Date()

  return (
    <Card title="Share with an Instant Hub user" sub="For funders and partners on Instant Hub. They'll find your report under Finances, Shared with me.">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (username.trim()) onGrant(username.trim().replace(/^@/, ''), scope, days)
          setUsername('')
        }}
      >
        <div className="ui-grid">
          <Field label="Their username">
            <input required maxLength={60} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. fund_za" autoCapitalize="off" />
          </Field>
          <ShareOptions scope={scope} setScope={setScope} days={days} setDays={setDays} />
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          <Button type="submit" variant="primary">
            Share
          </Button>
        </div>
      </form>
      {grants.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          {grants.map((g) => (
            <div key={g.id} className={`fin-share-row ${active(g) ? '' : 'off'}`}>
              <div>
                <b>@{g.grantee}</b>
                <div className="meta">
                  {g.scope === 'monthly' ? 'Month by month' : 'Summary'} · {g.revoked_at ? 'removed' : new Date(g.expires_at) < new Date() ? 'expired' : `until ${date(g.expires_at)}`} · viewed{' '}
                  {g.view_count} {g.view_count === 1 ? 'time' : 'times'}
                </div>
              </div>
              {active(g) && (
                <Button small variant="danger" onClick={() => onRevoke(g.id)}>
                  Remove access
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
