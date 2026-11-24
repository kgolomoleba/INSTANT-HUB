// Keeps the app itself available offline. Farm data is cached separately by
// the app (IndexedDB); this only stores the page, scripts, styles and icons.
const CACHE = 'berg-river-app-v2'
const SHELL = ['/', '/manifest.webmanifest', '/icon-192.png']

// Saves the page and the script/style files it uses, so the app opens offline
// even if the first visit was the only one.
async function precache() {
  const cache = await caches.open(CACHE)
  await cache.addAll(SHELL)
  const html = await (await cache.match('/')).text()
  const assets = [...new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]))]
  await Promise.all(assets.map((a) => cache.add(a).catch(() => {})))
}

self.addEventListener('install', (e) => {
  e.waitUntil(precache().then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== self.location.origin) return // data services: handled by the app

  // Pages: try the network first so updates show up, fall back to the saved copy offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put('/', copy))
          return res
        })
        .catch(() => caches.match('/', { ignoreVary: true })),
    )
    return
  }

  // Built files have content hashes in their names, so a saved copy is always right.
  e.respondWith(
    caches.match(req, { ignoreVary: true }).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copy))
          }
          return res
        }),
    ),
  )
})
