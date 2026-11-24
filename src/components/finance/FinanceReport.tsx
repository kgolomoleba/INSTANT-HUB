import { useState } from 'react'
import { health, monthLabel, pct, rand, type FinMonth, type FinSummary } from '../../utils/finance'
import { Card } from '../ui'
import './finance.css'

type Props = {
  summary: FinSummary
  months: FinMonth[] | null
  business?: string | null
  verified?: boolean
  /** Shown on shared reports. */
  footer?: React.ReactNode
}

const TONE_ICON = { good: '🟢', watch: '🟡', bad: '🔴', none: '⚪' } as const

/** The financial health report: same view for the owner, link viewers and funders. */
export default function FinanceReport({ summary, months, business, verified, footer }: Props) {
  const h = health(summary)
  const self = summary.months - summary.bank_months - summary.accounting_months

  return (
    <div className="fin-report">
      {business && (
        <div className="fin-business">
          <h2>{business}</h2>
          {verified && <span className="ui-badge green">✓ Verified business</span>}
        </div>
      )}

      <section className={`fin-health ${h.tone}`} aria-live="polite">
        <div className="fin-health-title">
          <span aria-hidden="true">{TONE_ICON[h.tone]}</span> {h.tone === 'none' ? 'No figures yet' : `Financial health: ${h.title}`}
        </div>
        {h.points.length > 0 && (
          <ul>
            {h.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
        {summary.months > 0 && (
          <p className="fin-period">
            Based on {summary.months} month{summary.months === 1 ? '' : 's'}
            {summary.first_month && summary.last_month ? `: ${monthLabel(summary.first_month)} to ${monthLabel(summary.last_month)}` : ''}.
          </p>
        )}
      </section>

      {summary.months > 0 && (
        <div className="fin-kpis">
          <Kpi label="Income" value={rand(summary.income)} note={`last ${summary.months} months`} />
          <Kpi label="Profit" value={rand(summary.profit)} note={h.margin != null ? `${pct(h.margin)} of income` : ''} tone={summary.profit >= 0 ? 'good' : 'bad'} />
          <Kpi
            label="Income trend"
            value={h.trend == null ? '—' : `${h.trend >= 0 ? '↑' : '↓'} ${pct(Math.abs(h.trend))}`}
            note={h.trend == null ? 'needs 6 months' : 'last 3 months vs 3 before'}
            tone={h.trend == null ? undefined : h.trend >= 0 ? 'good' : 'bad'}
          />
          <Kpi
            label="Cash runway"
            value={h.runway == null ? '—' : h.runway < 0 ? 'Overdrawn' : `${h.runway.toFixed(1)} months`}
            note={h.runway == null ? 'add a bank balance' : 'months of costs covered'}
            tone={h.runway == null ? undefined : h.runway >= 3 ? 'good' : 'bad'}
          />
        </div>
      )}

      {months && months.length > 0 && <MonthsChart months={months} />}
      {months && months.length > 0 && <MonthsTable months={months} />}

      {summary.months > 0 && (
        <p className="fin-source">
          Where the figures come from: {summary.bank_months > 0 && <span className="ui-badge gold">{summary.bank_months} from bank statements</span>}{' '}
          {summary.accounting_months > 0 && <span className="ui-badge gold">{summary.accounting_months} from accounting software</span>}{' '}
          {self > 0 && <span className="ui-badge">{self} typed in by the business</span>}
        </p>
      )}
      <p className="fin-disclaimer">
        This is a summary of figures supplied by the business. It is not audited and is not financial advice.
      </p>
      {footer}
    </div>
  )
}

function Kpi({ label, value, note, tone }: { label: string; value: string; note?: string; tone?: 'good' | 'bad' }) {
  return (
    <div className={`fin-kpi ${tone ?? ''}`}>
      <div className="fin-kpi-label">{label}</div>
      <div className="fin-kpi-value">{value}</div>
      {note && <div className="fin-kpi-note">{note}</div>}
    </div>
  )
}

const short = (n: number) => (Math.abs(n) >= 1e6 ? `R${(n / 1e6).toFixed(1)}m` : Math.abs(n) >= 1e3 ? `R${Math.round(n / 1e3)}k` : `R${Math.round(n)}`)

function MonthsChart({ months }: { months: FinMonth[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const ms = [...months].sort((a, b) => a.month.localeCompare(b.month)).slice(-12)
  const max = Math.max(1, ...ms.flatMap((m) => [m.income, m.expenses]))
  const top = (() => {
    const mag = 10 ** Math.floor(Math.log10(max))
    return Math.ceil(max / mag) * mag
  })()
  const W = 640
  const H = 220
  const L = 52
  const B = 26
  const iw = W - L - 8
  const ih = H - B - 10
  const gw = iw / ms.length
  const bw = Math.min(22, gw / 2 - 3)
  const y = (v: number) => 10 + ih - (v / top) * ih
  const ticks = [0, top / 2, top]

  return (
    <Card title="Money in and money out" className="fin-chart-card">
      <div className="fin-legend">
        <span>
          <i className="in" /> Money in
        </span>
        <span>
          <i className="out" /> Money out
        </span>
      </div>
      <div className="fin-chart">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Monthly money in and money out">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={L} x2={W - 8} y1={y(t)} y2={y(t)} className="fin-grid" />
              <text x={L - 6} y={y(t)} dy="0.32em" textAnchor="end" className="fin-tick">
                {short(t)}
              </text>
            </g>
          ))}
          {ms.map((m, i) => {
            const x = L + i * gw + gw / 2
            return (
              <g key={m.month} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
                <rect x={L + i * gw} y={10} width={gw} height={ih} fill="transparent" />
                <rect x={x - bw - 1} y={y(m.income)} width={bw} height={Math.max(0, y(0) - y(m.income))} rx={3} className="fin-bar in" />
                <rect x={x + 1} y={y(m.expenses)} width={bw} height={Math.max(0, y(0) - y(m.expenses))} rx={3} className="fin-bar out" />
                {(ms.length <= 8 || i % 2 === ms.length % 2) && (
                  <text x={x} y={H - 8} textAnchor="middle" className="fin-tick">
                    {monthLabel(m.month).split(' ')[0]}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
        {hover != null && (
          <div className="fin-tip" style={{ left: `${((L + hover * gw + gw / 2) / W) * 100}%` }}>
            <b>{monthLabel(ms[hover].month)}</b>
            <div>In: {rand(ms[hover].income)}</div>
            <div>Out: {rand(ms[hover].expenses)}</div>
            <div>Profit: {rand(ms[hover].income - ms[hover].expenses)}</div>
          </div>
        )}
      </div>
    </Card>
  )
}

const SOURCE = { manual: 'Typed in', bank_csv: 'Bank statement', accounting: 'Accounting' } as const

function MonthsTable({ months }: { months: FinMonth[] }) {
  const ms = [...months].sort((a, b) => b.month.localeCompare(a.month))
  return (
    <Card title="Month by month">
      <div className="ui-table-wrap">
        <table className="ui-table">
          <thead>
            <tr>
              <th>Month</th>
              <th className="num">Money in</th>
              <th className="num">Money out</th>
              <th className="num">Profit</th>
              <th className="num">Cash at month end</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {ms.map((m) => (
              <tr key={m.month}>
                <td>{monthLabel(m.month)}</td>
                <td className="num">{rand(m.income)}</td>
                <td className="num">{rand(m.expenses)}</td>
                <td className={`num ${m.income - m.expenses < 0 ? 'neg' : ''}`}>{rand(m.income - m.expenses)}</td>
                <td className="num">{m.cash_balance == null ? '—' : rand(m.cash_balance)}</td>
                <td>{SOURCE[m.source]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
