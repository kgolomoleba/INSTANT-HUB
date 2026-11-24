/** "just now", "5 minutes ago", "yesterday", "3 days ago"; older than a week: "12 Nov 2026". */
export function timeAgo(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return ''
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return ''
  const s = Math.round((t - now) / 1000)
  const abs = Math.abs(s)
  if (abs < 45) return 'just now'
  const rtf = new Intl.RelativeTimeFormat('en-ZA', { numeric: 'auto' })
  if (abs < 3600) return rtf.format(Math.round(s / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(s / 3600), 'hour')
  if (abs < 7 * 86400) return rtf.format(Math.round(s / 86400), 'day')
  return new Date(t).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Full date and time, for hover titles. */
export const fullDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' }) : ''
