/**
 * Image for listings without a photo: the listing's first letter on a calm
 * colour (not a stock photo of a stranger, which buyers could mistake for the
 * product or the seller).
 */
export function placeholderImage(title: string | null | undefined): string {
  const text = (title ?? '').trim()
  const letter = (text[0] ?? '?').toUpperCase().replace(/[<>&"']/g, '?')
  let h = 0
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) % 360
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="hsl(${h} 35% 88%)"/><text x="200" y="150" font-family="system-ui,sans-serif" font-size="120" font-weight="700" fill="hsl(${h} 35% 38%)" text-anchor="middle" dominant-baseline="central">${letter}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
