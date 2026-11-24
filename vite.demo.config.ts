import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Demo build: one script, one stylesheet, everything inlined into the files
// (then scripts/inline-html.mjs folds them into a single page).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist-demo',
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
})
