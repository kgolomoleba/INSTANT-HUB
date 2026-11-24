// Turns a built site (index.html + one script + one stylesheet) into ONE html
// file with everything inside it, for places that can only host a single page.
// Usage: node scripts/inline-html.mjs <distDir> <out.html>
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const [dir, out] = process.argv.slice(2)
let html = readFileSync(join(dir, 'index.html'), 'utf8')
const read = (p) => readFileSync(join(dir, p.replace(/^\.?\//, '')), 'utf8')

// Stylesheets first, then scripts (moved to the end of <body> so the page exists when they run).
// Local stylesheets are folded in; links to other sites (fonts) stay as links.
html = html.replace(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g, (tag, href) => (/^https?:/.test(href) ? tag : `<style>${read(href)}</style>`))
const scripts = []
html = html.replace(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g, (tag, src) => {
  if (/^https?:/.test(src)) return tag
  scripts.push(read(src).replace(/<\/script/gi, '<\\/script'))
  return ''
})
html = html.replace(/<link rel="(?:modulepreload|manifest|icon|apple-touch-icon)"[^>]*>/g, '')
// A function replacement: a plain string would treat $& and $' inside the code as special.
const tail = scripts.map((s) => `<script type="module">${s}</script>`).join('\n') + '\n</body>'
html = html.replace('</body>', () => tail)
writeFileSync(out, html)
console.log(`${out}: ${(html.length / 1024).toFixed(0)} KB`)
