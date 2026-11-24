import { locale, type Lang } from './i18n'

/** "5 minutes ago" / "5 minute gelede"; "just now" for under a minute. */
export function timeAgo(at: number, lang: Lang, now = Date.now()): string {
  const s = Math.round((at - now) / 1000)
  const abs = Math.abs(s)
  const rtf = new Intl.RelativeTimeFormat(locale(lang), { numeric: 'auto' })
  if (abs < 45) return lang === 'af' ? 'sopas' : 'just now'
  if (abs < 3600) return rtf.format(Math.round(s / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(s / 3600), 'hour')
  return rtf.format(Math.round(s / 86400), 'day')
}
