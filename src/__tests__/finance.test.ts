import { describe, expect, it } from 'vitest'
import { health, parseAmount, parseBankCsv, parseDate, rand, summarize, type FinMonth } from '../utils/finance'

const M = (month: string, income: number, expenses: number, cash: number | null = null, source: FinMonth['source'] = 'manual'): FinMonth => ({
  month,
  income,
  expenses,
  cash_balance: cash,
  debt: null,
  source,
})

describe('summarize + health', () => {
  const months = [
    M('2026-01-01', 30000, 25000, 10000),
    M('2026-02-01', 31000, 26000, 15000),
    M('2026-03-01', 29000, 31000, 13000),
    M('2026-04-01', 36000, 27000, 22000, 'bank_csv'),
    M('2026-05-01', 38000, 28000, 32000, 'bank_csv'),
    M('2026-06-01', 40000, 29000, 90000, 'bank_csv'),
  ]
  it('matches the database summary', () => {
    const s = summarize(months)
    expect(s).toMatchObject({ months: 6, income: 204000, expenses: 166000, profit: 38000, profitable_months: 5, latest_cash: 90000, recent_income: 114000, previous_income: 90000, bank_months: 3 })
  })
  it('calls a profitable, growing business with cash "Healthy"', () => {
    const h = health(summarize(months))
    expect(h.tone).toBe('good')
    expect(h.points.join(' ')).toMatch(/Profitable in 5 of 6 months/)
    expect(h.points.join(' ')).toMatch(/27% higher/)
    expect(h.runway).toBeCloseTo(90000 / (166000 / 6), 5)
  })
  it('calls a loss-making business with little cash "Under pressure"', () => {
    const h = health(summarize([M('2026-01-01', 10000, 15000, 5000), M('2026-02-01', 9000, 14000, 2000), M('2026-03-01', 12000, 11000, 1500)]))
    expect(h.tone).toBe('bad')
    expect(h.points[0]).toMatch(/loss of R 9 000/)
  })
  it('says "keep an eye on it" when profitable but cash covers under 3 months', () => {
    const h = health(summarize(months.map((m, i) => (i === 5 ? { ...m, cash_balance: 40000 } : m))))
    expect(h.tone).toBe('watch')
    expect(h.points.join(' ')).toMatch(/covers about 1\.4 months of costs/)
  })
  it('has nothing to say without figures', () => {
    expect(health(summarize([])).tone).toBe('none')
  })
  it('uses only the last 12 months', () => {
    const many = Array.from({ length: 15 }, (_, i) => M(`20${25 + Math.floor((i + 9) / 12)}-${String(((i + 9) % 12) + 1).padStart(2, '0')}-01`, 1000, 500))
    expect(summarize(many).months).toBe(12)
  })
  it('formats rand', () => {
    expect(rand(1234567.6)).toBe('R 1 234 568')
  })
})

describe('bank statement reading', () => {
  it('reads dates in South African bank formats', () => {
    expect(parseDate('2026/06/01')).toBe('2026-06-01')
    expect(parseDate('20260601')).toBe('2026-06-01')
    expect(parseDate('01/06/2026')).toBe('2026-06-01')
    expect(parseDate('1 Jun 2026')).toBe('2026-06-01')
    expect(parseDate('01-Okt-2026')).toBe('2026-10-01')
    expect(parseDate('nonsense')).toBeNull()
  })
  it('reads amounts with spaces, commas, R, Dr/Cr and brackets', () => {
    expect(parseAmount('R -1 234,56')).toBe(-1234.56)
    expect(parseAmount('1,234.56')).toBe(1234.56)
    expect(parseAmount('1 234.56 Dr')).toBe(-1234.56)
    expect(parseAmount('(250.00)')).toBe(-250)
    expect(parseAmount('500.00 Cr')).toBe(500)
    expect(parseAmount('')).toBeNull()
  })
  it('adds up a signed-amount statement (newest first) into months with end-of-month balance', () => {
    const csv = [
      'Account summary,Cheque account',
      '',
      'Date,Description,Amount,Balance',
      '2026/07/02,Sale,"1,000.00","6,000.00"',
      '2026/06/30,Rent,-2000.00,5000.00',
      '2026/06/15,Sale,4000.00,7000.00',
      '2026/06/01,Opening deposit,3000.00,3000.00',
    ].join('\n')
    const r = parseBankCsv(csv)
    expect(r.months).toEqual([
      { month: '2026-06-01', income: 7000, expenses: 2000, cash_balance: 5000, transactions: 3 },
      { month: '2026-07-01', income: 1000, expenses: 0, cash_balance: 6000, transactions: 1 },
    ])
  })
  it('handles separate debit/credit columns and semicolons', () => {
    const csv = ['Datum;Beskrywing;Debit;Credit;Saldo', '01/05/2026;Koop;150,00;;850,00', '03/05/2026;Verkoop;;1 200,00;2 050,00', 'bad row;;;;'].join('\n')
    const r = parseBankCsv(csv)
    expect(r.months).toEqual([{ month: '2026-05-01', income: 1200, expenses: 150, cash_balance: 2050, transactions: 2 }])
    expect(r.skipped).toBe(1)
  })
  it('explains files it cannot read', () => {
    expect(() => parseBankCsv('hello,world\n1,2')).toThrow(/date and amount columns/)
  })
})
