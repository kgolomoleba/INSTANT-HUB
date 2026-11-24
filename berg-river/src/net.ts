/**
 * Network helpers: timeouts, retries, and a cache that survives page reloads.
 *
 * Past satellite and weather data never changes, so it's kept on the device
 * (IndexedDB) and a farm you've looked at before opens without waiting.
 */

export class FetchError extends Error {
  constructor(
    message: string,
    /** network: blocked/offline/CORS; timeout; http: the server answered with an error */
    readonly kind: 'network' | 'timeout' | 'http',
    readonly status?: number
  ) {
    super(message)
  }
}

type Options = {
  headers?: Record<string, string>
  /** Send as a JSON POST. Part of the cache key. */
  body?: unknown
  /** How long a saved answer stays valid. 0 = don't save on the device. */
  ttlMs?: number
  timeoutMs?: number
  retries?: number
  /** Readable name of the service, for error messages. */
  label?: string
}

const DAY = 86_400_000
export const TTL = { past: 30 * DAY, recent: DAY / 4, none: 0 }

type Loaded<T> = { v: T; at: number }
const memory = new Map<string, Promise<Loaded<unknown>>>()

/** Collects how old the data behind one screen is (the oldest piece wins). */
export class AgeTracker {
  oldest = Infinity
  add(at: number) {
    if (at < this.oldest) this.oldest = at
  }
}
let tracker: AgeTracker | null = null

/**
 * Runs `start` (which should begin its requests straight away) and tracks the
 * age of everything those requests return: time of the network answer, or when
 * a saved copy was originally fetched.
 */
export function trackAge(start: () => void): AgeTracker {
  const t = new AgeTracker()
  tracker = t
  try {
    start()
  } finally {
    tracker = null
  }
  return t
}

export function fetchJson<T>(url: string, opts: Options = {}): Promise<T> {
  const key =
    opts.body === undefined ? url : `${url} ${JSON.stringify(opts.body)}`
  const tr = tracker
  let p = memory.get(key) as Promise<Loaded<T>> | undefined
  if (!p) {
    p = (async (): Promise<Loaded<T>> => {
      if (opts.ttlMs) {
        const saved = await store.getEntry<T>(key)
        if (saved) return { v: saved.v, at: saved.at }
      }
      const data = await fetchWithRetry<T>(url, opts)
      const at = Date.now()
      if (opts.ttlMs) void store.set(key, data, opts.ttlMs, at)
      return { v: data, at }
    })()
    p.catch(() => memory.delete(key))
    memory.set(key, p as Promise<Loaded<unknown>>)
  }
  return p.then((r) => {
    tr?.add(r.at)
    return r.v
  })
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function fetchOnce<T>(
  url: string,
  opts: Options,
  label: string
): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 45_000)
  try {
    let res: Response
    try {
      res = await fetch(url, {
        method: opts.body === undefined ? 'GET' : 'POST',
        headers: {
          Accept: 'application/json',
          ...(opts.body === undefined
            ? {}
            : { 'Content-Type': 'application/json' }),
          ...opts.headers,
        },
        body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
        signal: ctrl.signal,
      })
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError')
        throw new FetchError(`${label} took too long to answer`, 'timeout')
      throw new FetchError(`couldn't reach ${label}`, 'network')
    }
    if (!res.ok)
      throw new FetchError(
        `${label} answered ${res.status}`,
        'http',
        res.status
      )
    try {
      return (await res.json()) as T
    } catch {
      throw new FetchError(
        `${label} sent an unreadable answer`,
        'http',
        res.status
      )
    }
  } finally {
    clearTimeout(timer)
  }
}

/** Worth trying again: busy, rate-limited, briefly down, or slow. */
function retryable(e: FetchError, attempt: number): boolean {
  if (e.kind === 'timeout') return true
  if (e.kind === 'http') return e.status === 429 || (e.status ?? 0) >= 500
  // A blocked (CORS) request fails the same way every time: retry once only.
  return attempt === 0
}

async function fetchWithRetry<T>(url: string, opts: Options): Promise<T> {
  const retries = opts.retries ?? 2
  const label = opts.label ?? new URL(url).host
  for (let attempt = 0; ; attempt++) {
    try {
      return await fetchOnce<T>(url, opts, label)
    } catch (e) {
      const err = e as FetchError
      if (attempt >= retries || !retryable(err, attempt)) throw err
      await sleep(800 * 2 ** attempt + Math.random() * 300)
    }
  }
}

// ---------------------------------------------------------------- IndexedDB
type Entry = { v: unknown; exp: number; at?: number }
const DB = 'berg-river-cache'
const OS = 'responses'
let dbp: Promise<IDBDatabase | null> | null = null

function db(): Promise<IDBDatabase | null> {
  if (!dbp)
    dbp = new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB, 1)
        req.onupgradeneeded = () => req.result.createObjectStore(OS)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => resolve(null)
        req.onblocked = () => resolve(null)
      } catch {
        resolve(null) // private mode, no IndexedDB, tests
      }
    })
  return dbp
}

function tx<R>(
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<R>
): Promise<R | undefined> {
  return db().then(
    (d) =>
      new Promise((resolve) => {
        if (!d) return resolve(undefined)
        try {
          const r = fn(d.transaction(OS, mode).objectStore(OS))
          r.onsuccess = () => resolve(r.result)
          r.onerror = () => resolve(undefined)
        } catch {
          resolve(undefined)
        }
      })
  )
}

export const store = {
  async getEntry<T>(key: string): Promise<{ v: T; at: number } | undefined> {
    const e = (await tx('readonly', (s) => s.get(key))) as Entry | undefined
    if (!e) return undefined
    if (e.exp < Date.now()) {
      void tx('readwrite', (s) => s.delete(key))
      return undefined
    }
    return { v: e.v as T, at: e.at ?? e.exp - TTL.recent }
  },
  async get<T>(key: string): Promise<T | undefined> {
    return (await store.getEntry<T>(key))?.v
  },
  async set(
    key: string,
    v: unknown,
    ttlMs: number,
    at = Date.now()
  ): Promise<void> {
    await tx('readwrite', (s) =>
      s.put({ v, exp: at + ttlMs, at } satisfies Entry, key)
    )
  },
  async clear(): Promise<void> {
    memory.clear()
    await tx('readwrite', (s) => s.clear())
  },
}

/** Past data never changes; data reaching into the last ~10 days may still be filled in. */
export function ttlFor(endDate: string): number {
  return Date.parse(endDate + 'T00:00:00Z') < Date.now() - 10 * DAY
    ? TTL.past
    : TTL.recent
}
