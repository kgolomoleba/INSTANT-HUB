/** Financial health: monthly totals, the health summary, and bank-statement import. */

export type FinMonth = {
  id?: string
  month: string // YYYY-MM-01
  income: number
  expenses: number
  cash_balance: number | null
  debt: number | null
  source: 'manual' | 'bank_csv' | 'accounting'
  note?: string | null
}

/** Same shape as the database's fin_build_report summary. */
export type FinSummary = {
  months: number
  first_month: string | null
  last_month: string | null
  income: number
  expenses: number
  profit: number
  profitable_months: number
  avg_monthly_expenses: number
  latest_cash: number | null
  latest_debt: number | null
  recent_income: number
  previous_income: number
  bank_months: number
  accounting_months: number
}

export type FinReport = {
  business: string | null
  verification_status: string | null
  scope: 'summary' | 'monthly'
  generated_at: string
  summary: FinSummary
  months: FinMonth[] | null
  shared_as?: string
  expires_at?: string
}

const num = (v: unknown) => (v == null || v === '' ? null : Number(v))

/** The last 12 recorded months, summarised exactly like the database does. */
export function summarize(all: FinMonth[]): FinSummary {
  const m = [...all].sort((a, b) => b.month.localeCompare(a.month)).slice(0, 12)
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
  const latest = (k: 'cash_balance' | 'debt') => m.find((x) => x[k] != null)?.[k] ?? null
  return {
    months: m.length,
    first_month: m.length ? m[m.length - 1].month : null,
    last_month: m.length ? m[0].month : null,
    income: sum(m.map((x) => x.income)),
    expenses: sum(m.map((x) => x.expenses)),
    profit: sum(m.map((x) => x.income - x.expenses)),
    profitable_months: m.filter((x) => x.income > x.expenses).length,
    avg_monthly_expenses: m.length ? sum(m.map((x) => x.expenses)) / m.length : 0,
    latest_cash: latest('cash_balance'),
    latest_debt: latest('debt'),
    recent_income: sum(m.slice(0, 3).map((x) => x.income)),
    previous_income: sum(m.slice(3, 6).map((x) => x.income)),
    bank_months: m.filter((x) => x.source === 'bank_csv').length,
    accounting_months: m.filter((x) => x.source === 'accounting').length,
  }
}

/** Normalise a summary that came back as JSON from the database (numbers may be strings). */
export function normalizeSummary(s: Record<string, unknown>): FinSummary {
  return {
    months: Number(s.months) || 0,
    first_month: (s.first_month as string) ?? null,
    last_month: (s.last_month as string) ?? null,
    income: Number(s.income) || 0,
    expenses: Number(s.expenses) || 0,
    profit: Number(s.profit) || 0,
    profitable_months: Number(s.profitable_months) || 0,
    avg_monthly_expenses: Number(s.avg_monthly_expenses) || 0,
    latest_cash: num(s.latest_cash),
    latest_debt: num(s.latest_debt),
    recent_income: Number(s.recent_income) || 0,
    previous_income: Number(s.previous_income) || 0,
    bank_months: Number(s.bank_months) || 0,
    accounting_months: Number(s.accounting_months) || 0,
  }
}

export type Health = {
  tone: 'good' | 'watch' | 'bad' | 'none'
  title: string
  points: string[]
  margin: number | null // profit / income
  trend: number | null // recent 3 months vs the 3 before, as a fraction
  runway: number | null // months of costs covered by cash
}

/**
 * Plain-language health check. Deliberately simple and explainable:
 * profitability, how often the business made a profit, the income trend, and
 * how many months of costs the cash in the bank covers.
 */
export function health(s: FinSummary): Health {
  if (!s.months) return { tone: 'none', title: 'No figures yet', points: [], margin: null, trend: null, runway: null }
  const margin = s.income > 0 ? s.profit / s.income : null
  const trend = s.months >= 6 && s.previous_income > 0 ? (s.recent_income - s.previous_income) / s.previous_income : null
  const runway = s.latest_cash != null && s.avg_monthly_expenses > 0 ? s.latest_cash / s.avg_monthly_expenses : null
  const share = s.profitable_months / s.months

  const points: string[] = []
  points.push(
    s.profit >= 0
      ? `Made a profit of ${rand(s.profit)} over ${s.months} month${s.months === 1 ? '' : 's'}${margin != null ? ` (${pct(margin)} of income)` : ''}.`
      : `Made a loss of ${rand(-s.profit)} over ${s.months} month${s.months === 1 ? '' : 's'}.`,
  )
  points.push(`Profitable in ${s.profitable_months} of ${s.months} months.`)
  if (trend != null)
    points.push(
      Math.abs(trend) < 0.05
        ? 'Income over the last 3 months was about the same as the 3 before.'
        : `Income over the last 3 months was ${pct(Math.abs(trend))} ${trend > 0 ? 'higher' : 'lower'} than the 3 before.`,
    )
  if (runway != null)
    points.push(
      runway < 0 ? 'Cash in the bank is negative (overdrawn).' : `Cash in the bank covers about ${runway.toFixed(1)} months of costs.`,
    )

  const bad = s.profit < 0 && (share < 0.5 || (runway != null && runway < 2))
  const good = s.profit > 0 && share >= 0.6 && (runway == null || runway >= 3) && (trend == null || trend > -0.2)
  const tone = bad ? 'bad' : good ? 'good' : 'watch'
  const title = tone === 'good' ? 'Healthy' : tone === 'bad' ? 'Under pressure' : 'Keep an eye on it'
  return { tone, title, points, margin, trend, runway }
}

/** "R 1 234 568" (whole rands, spaces between thousands, as written in South Africa). */
export const rand = (n: number) => {
  const r = Math.round(n)
  return (r < 0 ? '-R ' : 'R ') + String(Math.abs(r)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}
export const pct = (f: number) => `${Math.round(f * 100)}%`
export const monthLabel = (m: string) =>
  new Date(m.slice(0, 7) + '-01T00:00:00Z').toLocaleDateString('en-ZA', { month: 'short', year: 'numeric', timeZone: 'UTC' })

// ------------------------------------------------------- bank statements
export type CsvMonth = { month: string; income: number; expenses: number; cash_balance: number | null; transactions: number }
export type CsvResult = { months: CsvMonth[]; skipped: number }

/** Split one CSV line (comma or semicolon), honouring quotes. */
function splitLine(line: string, sep: string): string[] {
  const out: string[] = []
  let cur = ''
  let q = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (q) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (c === '"') q = false
      else cur += c
    } else if (c === '"') q = true
    else if (c === sep) {
      out.push(cur.trim())
      cur = ''
    } else cur += c
  }
  out.push(cur.trim())
  return out
}

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12, mei: 5, okt: 10, des: 12 }

/** YYYY-MM-DD from the date formats South African banks export. */
export function parseDate(raw: string): string | null {
  const s = raw.trim().replace(/^"|"$/g, '')
  let m = s.match(/^(\d{4})[-/.]?(\d{2})[-/.]?(\d{2})/) // 2026-06-01, 2026/06/01, 20260601
  if (m) return valid(+m[1], +m[2], +m[3])
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/) // 01/06/2026 (day first)
  if (m) return valid(+m[3], +m[2], +m[1])
  m = s.match(/^(\d{1,2})[\s-]([A-Za-z]{3})[A-Za-z]*[\s-](\d{4})/) // 1 Jun 2026, 01-Jun-2026
  if (m && MONTHS[m[2].toLowerCase()]) return valid(+m[3], MONTHS[m[2].toLowerCase()], +m[1])
  return null
}
function valid(y: number, mo: number, d: number): string | null {
  if (y < 2000 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > 31) return null
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** "R -1 234,56", "1,234.56", "-1234.56", "1 234.56 Dr" → number. */
export function parseAmount(raw: string): number | null {
  let s = raw.trim().replace(/^"|"$/g, '')
  if (!s) return null
  let sign = 1
  if (/\bdr\b/i.test(s) || /^\(.*\)$/.test(s)) sign = -1
  s = s.replace(/\b(cr|dr)\b/gi, '').replace(/[R\s()]/g, '')
  if (s.startsWith('-')) {
    sign = -sign
    s = s.slice(1)
  }
  // Decimal comma (e.g. 1.234,56 or 234,56) vs thousands comma (1,234.56).
  if (/,\d{1,2}$/.test(s) && !/\.\d{1,2}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.')
  else s = s.replace(/,/g, '')
  if (!/^\d+(\.\d+)?$/.test(s)) return null
  return sign * Number(s)
}

/**
 * Add up a bank statement CSV into monthly totals: money in, money out, and
 * the balance at the end of each month (if the statement has a balance
 * column). Works with a signed amount column or separate debit/credit
 * columns. Individual transactions are not kept.
 */
export function parseBankCsv(text: string): CsvResult {
  const lines = text.replace(/^\ufeff/, '').split(/\r?\n/).filter((l) => l.trim())
  if (!lines.length) return { months: [], skipped: 0 }
  const sep = (lines.slice(0, 20).join('\n').match(/;/g)?.length ?? 0) > (lines.slice(0, 20).join('\n').match(/,/g)?.length ?? 0) ? ';' : ','

  // Find the header row: the first one with a date-like and an amount-like column.
  let head = -1
  let cols: string[] = []
  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    const c = splitLine(lines[i], sep).map((x) => x.toLowerCase())
    if (c.some((x) => /date|datum/.test(x)) && c.some((x) => /amount|bedrag|debit|credit|money|withdraw|deposit/.test(x))) {
      head = i
      cols = c
      break
    }
  }
  if (head < 0) throw new Error("Couldn't find the date and amount columns in this file.")
  const find = (re: RegExp) => cols.findIndex((x) => re.test(x))
  const iDate = find(/date|datum/)
  const iAmount = find(/^amount$|^bedrag$|amount|bedrag/)
  const iDebit = find(/debit|money out|withdraw|uitbetaling/)
  const iCredit = find(/credit|money in|deposit|inbetaling/)
  const iBalance = find(/balance|saldo/)
  const signed = iDebit < 0 || iCredit < 0
  if (signed && iAmount < 0) throw new Error("Couldn't find the amount column in this file.")

  type Tx = { date: string; amount: number; balance: number | null; order: number }
  const txs: Tx[] = []
  let skipped = 0
  lines.slice(head + 1).forEach((line, order) => {
    const c = splitLine(line, sep)
    const date = parseDate(c[iDate] ?? '')
    let amount: number | null
    if (!signed) {
      const credit = parseAmount(c[iCredit] ?? '') ?? 0
      const debit = parseAmount(c[iDebit] ?? '') ?? 0
      amount = credit === 0 && debit === 0 && iAmount >= 0 ? parseAmount(c[iAmount] ?? '') : Math.abs(credit) - Math.abs(debit)
    } else amount = parseAmount(c[iAmount] ?? '')
    if (!date || amount == null) return void skipped++
    txs.push({ date, amount, balance: iBalance >= 0 ? parseAmount(c[iBalance] ?? '') : null, order })
  })
  if (!txs.length) throw new Error('No transactions found in this file.')

  // Statements list newest-first or oldest-first; sort to chronological order.
  const newestFirst = txs.length > 1 && txs[0].date > txs[txs.length - 1].date
  txs.sort((a, b) => a.date.localeCompare(b.date) || (newestFirst ? b.order - a.order : a.order - b.order))

  const by = new Map<string, CsvMonth>()
  for (const t of txs) {
    const key = t.date.slice(0, 7) + '-01'
    const m = by.get(key) ?? { month: key, income: 0, expenses: 0, cash_balance: null, transactions: 0 }
    if (t.amount >= 0) m.income += t.amount
    else m.expenses += -t.amount
    if (t.balance != null) m.cash_balance = t.balance // last one in the month wins
    m.transactions++
    by.set(key, m)
  }
  const months = [...by.values()]
    .map((m) => ({ ...m, income: Math.round(m.income * 100) / 100, expenses: Math.round(m.expenses * 100) / 100 }))
    .sort((a, b) => a.month.localeCompare(b.month))
  return { months, skipped }
}
