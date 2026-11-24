/**
 * Demo mode: a stand-in for the Supabase database with clearly made-up sample
 * data, so the app can be shown on a page that has no database (for example
 * inside claude.ai). Only built when VITE_DEMO=1; never part of the real site.
 */
export const DEMO_URL = 'https://demo.supabase.co'
const ME = 'demo-user'

type Row = Record<string, unknown>
const iso = (minutesAgo: number) => new Date(Date.now() - minutesAgo * 60_000).toISOString()
const day = 1440

function seed(): Record<string, Row[]> {
  const monthStart = (back: number) => {
    const d = new Date()
    d.setUTCDate(1)
    d.setUTCMonth(d.getUTCMonth() - back)
    return d.toISOString().slice(0, 10)
  }
  const fin = [
    [7, 28400, 24100, 18200],
    [6, 30100, 25300, 23000],
    [5, 29500, 31000, 21500],
    [4, 33800, 26900, 28400],
    [3, 35200, 27800, 35800],
    [2, 38100, 29900, 44000],
    [1, 36400, 30800, 49500],
  ].map(([back, income, expenses, cash], i) => ({
    id: `fm${i}`,
    user_id: ME,
    month: monthStart(back),
    income,
    expenses,
    cash_balance: cash,
    debt: null,
    source: back <= 3 ? 'bank_csv' : 'manual',
    note: null,
  }))
  return {
    profiles: [
      { id: ME, username: 'thandi_m', bio: 'Grows and sells organic vegetables and runs a small spaza shop in Paarl.', role: 'seller', location: 'Paarl', avatar_url: null, verification_status: 'unverified', verification_method: null, created_at: iso(120 * day) },
    ],
    public_profiles: [
      { id: ME, username: 'thandi_m', avatar_url: null, verification_status: 'unverified' },
      { id: 'u2', username: 'sipho_builds', avatar_url: null, verification_status: 'verified' },
      { id: 'u3', username: 'nomsa_bakes', avatar_url: null, verification_status: 'verified' },
      { id: 'u4', username: 'karoo_tutors', avatar_url: null, verification_status: 'unverified' },
    ],
    products: [
      { id: 'p1', user_id: ME, title: 'Organic butternut (10 kg bag)', description: 'Grown without chemicals and picked to order. Delivered weekly in Paarl and Wellington.', price: 120, location: 'Paarl', image_url: '', category: 'Other', created_at: iso(3 * day) },
      { id: 'p2', user_id: ME, title: 'Free-range eggs, tray of 30', description: 'Collected fresh each morning.', price: 85, location: 'Paarl', image_url: '', category: 'Other', created_at: iso(5 * day) },
      { id: 'p3', user_id: 'u3', title: 'Rusks, 1 kg box', description: 'Buttermilk rusks baked in small batches.', price: 95, location: 'Wellington', image_url: '', category: 'Handmade', created_at: iso(1 * day) },
      { id: 'p4', user_id: 'u2', title: 'Solar lamp and phone charger kit', description: 'Works through load shedding. 12-month warranty.', price: 450, location: 'Paarl', image_url: '', category: 'Tech', created_at: iso(2 * day) },
      { id: 'p5', user_id: 'u3', title: 'Hand-poured soy candles (set of 3)', description: 'Rooibos and honey scents.', price: 160, location: 'Riebeek Kasteel', image_url: '', category: 'Handmade', created_at: iso(6 * day) },
      { id: 'p6', user_id: 'u2', title: 'Custom steel braai stand', description: 'Made to measure. Two-week lead time.', price: 1250, location: 'Paarl', image_url: '', category: 'Design', created_at: iso(8 * day) },
    ],
    services: [
      { id: 's1', user_id: 'u4', title: 'Maths and science tutoring, Grades 8 to 12', description: 'Online or in person, afternoons and Saturdays.', price: 180, location: 'Wellington', image_url: '', category: 'Tutoring', created_at: iso(2 * day) },
      { id: 's2', user_id: 'u2', title: 'Tractor hire with operator', description: 'Ploughing and planting, per hour.', price: 950, location: 'Porterville', image_url: '', category: 'Other', created_at: iso(4 * day) },
      { id: 's3', user_id: 'u3', title: 'Event baking and catering', description: 'Cakes, tarts and savoury platters for up to 80 guests.', price: 2500, location: 'Wellington', image_url: '', category: 'Consulting', created_at: iso(9 * day) },
      { id: 's4', user_id: 'u4', title: 'Website for small businesses', description: 'Simple, fast, mobile-friendly sites.', price: 4500, location: 'Paarl', image_url: '', category: 'Web Development', created_at: iso(12 * day) },
    ],
    posts: [
      { id: 'f1', user_id: 'u2', username: 'sipho_builds', title: 'Looking for 6 seasonal pickers', description: 'Work starts next week near Riebeek West. Transport provided.', price: null, type: 'request', created_at: iso(125) },
      { id: 'f2', user_id: 'u3', username: 'nomsa_bakes', title: 'Selling surplus flour, 12.5 kg bags', description: 'Bulk price for other bakers. Pickup in Wellington.', price: 'R280', type: 'product', created_at: iso(7 * 60) },
      { id: 'f3', user_id: 'u4', username: 'karoo_tutors', title: 'Free exam-prep workshop on Saturday', description: 'Grade 12 maths paper 1. Bring a calculator.', type: 'general', created_at: iso(2 * day) },
    ],
    inquiries: [
      { id: 'i1', sender_id: 'u2', recipient_id: ME, sender_username: 'sipho_builds', listing_type: 'product', listing_title: 'Organic butternut (10 kg bag)', message: 'Hi Thandi, can you deliver 5 bags to Porterville on Friday?', read: false, status: 'sent', created_at: iso(95) },
      { id: 'i2', sender_id: 'u3', recipient_id: ME, sender_username: 'nomsa_bakes', listing_type: 'product', listing_title: 'Free-range eggs, tray of 30', message: 'Do you have 10 trays available each week?', read: true, status: 'responded', responded_at: iso(day), created_at: iso(2 * day) },
    ],
    fin_months: fin,
    fin_share_links: [],
    events: [],
  }
}

/** supabase-js keeps its session in storage; in the demo that is plain memory. */
export function demoAuthStorage() {
  const user = { id: ME, email: 'thandi@example.com', aud: 'authenticated', role: 'authenticated', created_at: iso(120 * day), user_metadata: { username: 'thandi_m' } }
  const exp = Math.floor(Date.now() / 1000) + 10 * 365 * 86400
  const session = { access_token: 'demo', refresh_token: 'demo', token_type: 'bearer', expires_in: 3153600000, expires_at: exp, user }
  const mem = new Map<string, string>([['sb-demo-auth-token', JSON.stringify(session)]])
  return {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, v),
    removeItem: (k: string) => void mem.delete(k),
  }
}

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } })

function applyFilters(rows: Row[], params: URLSearchParams): Row[] {
  let out = rows
  for (const [k, v] of params) {
    if (['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'].includes(k)) continue
    const m = /^(not\.)?(eq|neq|in|is|gte|lte|gt|lt)\.(.*)$/.exec(v)
    if (!m) continue
    const [, neg, op, arg] = m
    const test = (r: Row) => {
      const val = r[k]
      switch (op) {
        case 'eq': return String(val) === arg
        case 'neq': return String(val) !== arg
        case 'in': return arg.replace(/^\(|\)$/g, '').split(',').map((x) => x.replace(/^"|"$/g, '')).includes(String(val))
        case 'is': return arg === 'null' ? val == null : String(val) === arg
        case 'gte': return String(val) >= arg
        case 'lte': return String(val) <= arg
        case 'gt': return String(val) > arg
        default: return String(val) < arg
      }
    }
    out = out.filter((r) => (neg ? !test(r) : test(r)))
  }
  return out
}

export function installDemo() {
  const db = seed()
  const realFetch = window.fetch.bind(window)
  let nextId = 1000

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input.toString() : input.url)
    if (url.origin !== DEMO_URL) return realFetch(input, init)
    const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase()
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined))
    const path = url.pathname

    // ---- auth: any email and password signs in
    const user = { id: ME, email: 'thandi@example.com', aud: 'authenticated', role: 'authenticated', created_at: iso(120 * day), user_metadata: { username: 'thandi_m' } }
    const session = { access_token: 'demo', refresh_token: 'demo', token_type: 'bearer', expires_in: 3153600000, expires_at: Math.floor(Date.now() / 1000) + 10 * 365 * 86400, user }
    if (path.startsWith('/auth/v1/token')) return json(session)
    if (path.startsWith('/auth/v1/signup')) return json({ ...user, identities: [{}] })
    if (path.startsWith('/auth/v1/user')) return json(user)
    if (path.startsWith('/auth/v1/logout')) return new Response(null, { status: 204 })
    if (path.startsWith('/storage/v1/')) return json({ Key: 'demo/placeholder.png' })

    // ---- RPC functions
    if (path.startsWith('/rest/v1/rpc/')) {
      const fn = path.split('/').pop()
      if (fn === 'username_available') return json(true)
      if (fn === 'fin_my_grants' || fn === 'fin_shared_with_me') return json([])
      if (fn === 'fin_grant_access') return json({ message: 'Sharing with other users is not available in the demo.' }, 400)
      return json(null)
    }

    if (!path.startsWith('/rest/v1/')) return json({})
    const table = path.split('/')[3]
    const rows = (db[table] ??= [])
    const prefer = headers.get('Prefer') ?? ''
    const body = init?.body ? JSON.parse(String(init.body)) : null

    if (method === 'GET' || method === 'HEAD') {
      let r = applyFilters(rows, url.searchParams)
      const total = r.length
      const order = url.searchParams.get('order')
      if (order) {
        const [col, dir] = order.split('.')
        r = [...r].sort((a, b) => (String(a[col]) < String(b[col]) ? -1 : String(a[col]) > String(b[col]) ? 1 : 0) * (dir === 'desc' ? -1 : 1))
      }
      const limit = Number(url.searchParams.get('limit'))
      if (limit) r = r.slice(0, limit)
      const range = { 'Content-Range': `0-${Math.max(0, r.length - 1)}/${total}`, 'Access-Control-Expose-Headers': 'Content-Range' }
      if (method === 'HEAD') return new Response(null, { status: 200, headers: range })
      if ((headers.get('Accept') ?? '').includes('vnd.pgrst.object')) return r.length ? json(r[0], 200, range) : json({ code: 'PGRST116', message: 'The result contains 0 rows' }, 406)
      return json(r, 200, range)
    }

    if (method === 'POST') {
      const list = (Array.isArray(body) ? body : [body]) as Row[]
      const conflict = url.searchParams.get('on_conflict')?.split(',')
      const saved: Row[] = []
      for (const item of list) {
        const existing = conflict ? rows.find((r) => conflict.every((c) => String(r[c]) === String(item[c]))) : undefined
        if (existing) {
          if (!prefer.includes('ignore-duplicates')) Object.assign(existing, item)
          saved.push(existing)
        } else {
          const row = { id: `demo-${nextId++}`, created_at: new Date().toISOString(), ...item }
          if (table === 'fin_share_links') Object.assign(row, { token: Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join(''), view_count: 0, revoked_at: null, last_viewed_at: null })
          rows.unshift(row)
          saved.push(row)
        }
      }
      return prefer.includes('return=representation') ? json(Array.isArray(body) ? saved : saved[0], 201) : new Response(null, { status: 201 })
    }

    if (method === 'PATCH') {
      for (const r of applyFilters(rows, url.searchParams)) Object.assign(r, body)
      return new Response(null, { status: 204 })
    }
    if (method === 'DELETE') {
      const gone = new Set(applyFilters(rows, url.searchParams))
      db[table] = rows.filter((r) => !gone.has(r))
      return new Response(null, { status: 204 })
    }
    return json({})
  }

  // A small label so nobody mistakes the sample data for real businesses.
  const addRibbon = () => {
    if (document.getElementById('demo-ribbon')) return
    const el = document.createElement('div')
    el.id = 'demo-ribbon'
    el.textContent = 'DEMO · sample data'
    el.setAttribute('style', 'position:fixed;right:10px;bottom:calc(72px + env(safe-area-inset-bottom,0px));z-index:5000;background:#f59e0b;color:#111;font:700 11px/1 system-ui,sans-serif;letter-spacing:.06em;padding:7px 10px;border-radius:999px;box-shadow:0 4px 14px rgba(0,0,0,.35);pointer-events:none')
    document.body.appendChild(el)
  }
  if (document.body) addRibbon()
  else document.addEventListener('DOMContentLoaded', addRibbon)
}
