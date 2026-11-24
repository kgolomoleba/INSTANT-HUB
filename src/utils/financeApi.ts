import { supabase } from '../supabaseClient'
import { normalizeSummary, type FinMonth, type FinReport } from './finance'

const fail = (e: { message?: string } | null) => {
  if (e) throw new Error(e.message || 'Something went wrong')
}

export async function listMonths(): Promise<FinMonth[]> {
  const { data, error } = await supabase.from('fin_months').select('id,month,income,expenses,cash_balance,debt,source,note').order('month')
  fail(error)
  return (data ?? []).map((r) => ({
    ...r,
    income: Number(r.income),
    expenses: Number(r.expenses),
    cash_balance: r.cash_balance == null ? null : Number(r.cash_balance),
    debt: r.debt == null ? null : Number(r.debt),
  })) as FinMonth[]
}

/** Add or replace months (one row per month). */
export async function saveMonths(userId: string, months: FinMonth[]): Promise<void> {
  const rows = months.map(({ month, income, expenses, cash_balance, debt, source, note }) => ({
    user_id: userId,
    month,
    income,
    expenses,
    cash_balance,
    debt,
    source,
    note: note ?? null,
    updated_at: new Date().toISOString(),
  }))
  const { error } = await supabase.from('fin_months').upsert(rows, { onConflict: 'user_id,month' })
  fail(error)
}

export async function deleteMonth(id: string): Promise<void> {
  const { error } = await supabase.from('fin_months').delete().eq('id', id)
  fail(error)
}

export async function deleteAllFinance(): Promise<void> {
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) throw new Error('Sign in first')
  for (const t of ['fin_share_links', 'fin_grants', 'fin_months'] as const) {
    const { error } = await supabase.from(t).delete().eq(t === 'fin_grants' ? 'owner_id' : 'user_id', uid)
    fail(error)
  }
}

export type ShareLink = { id: string; token: string; label: string; scope: 'summary' | 'monthly'; expires_at: string; revoked_at: string | null; view_count: number; last_viewed_at: string | null }
export type Grant = { id: string; grantee: string; scope: 'summary' | 'monthly'; expires_at: string; revoked_at: string | null; view_count: number; last_viewed_at: string | null }

export async function listLinks(): Promise<ShareLink[]> {
  const { data, error } = await supabase.from('fin_share_links').select('id,token,label,scope,expires_at,revoked_at,view_count,last_viewed_at').order('created_at', { ascending: false })
  fail(error)
  return (data ?? []) as ShareLink[]
}

export async function createLink(label: string, scope: 'summary' | 'monthly', days: number): Promise<void> {
  const { error } = await supabase.from('fin_share_links').insert({ label, scope, expires_at: new Date(Date.now() + days * 86_400_000).toISOString() })
  fail(error)
}

export async function revokeLink(id: string): Promise<void> {
  const { error } = await supabase.from('fin_share_links').update({ revoked_at: new Date().toISOString() }).eq('id', id)
  fail(error)
}

export async function listGrants(): Promise<Grant[]> {
  const { data, error } = await supabase.rpc('fin_my_grants')
  fail(error)
  return (data ?? []) as Grant[]
}

export async function grantAccess(username: string, scope: 'summary' | 'monthly', days: number): Promise<void> {
  const { error } = await supabase.rpc('fin_grant_access', { p_username: username, p_scope: scope, p_days: days })
  fail(error)
}

export async function revokeGrant(id: string): Promise<void> {
  const { error } = await supabase.from('fin_grants').update({ revoked_at: new Date().toISOString() }).eq('id', id)
  fail(error)
}

export async function sharedWithMe(): Promise<{ owner_id: string; business: string; scope: string; expires_at: string }[]> {
  const { data, error } = await supabase.rpc('fin_shared_with_me')
  fail(error)
  return data ?? []
}

function toReport(raw: unknown): FinReport | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  return {
    ...(r as unknown as FinReport),
    summary: normalizeSummary((r.summary ?? {}) as Record<string, unknown>),
    months: Array.isArray(r.months)
      ? (r.months as Record<string, unknown>[]).map((m) => ({
          month: String(m.month),
          income: Number(m.income),
          expenses: Number(m.expenses),
          cash_balance: m.cash_balance == null ? null : Number(m.cash_balance),
          debt: m.debt == null ? null : Number(m.debt),
          source: m.source as FinMonth['source'],
        }))
      : null,
  }
}

export async function reportByLink(token: string): Promise<FinReport | null> {
  const { data, error } = await supabase.rpc('fin_report_by_link', { p_token: token })
  fail(error)
  return toReport(data)
}

export async function reportByGrant(ownerId: string): Promise<FinReport | null> {
  const { data, error } = await supabase.rpc('fin_report_by_grant', { p_owner: ownerId })
  fail(error)
  return toReport(data)
}

export const shareUrl = (token: string) => `${window.location.origin}/report/${token}`
