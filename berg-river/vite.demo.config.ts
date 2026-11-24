import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Demo build: everything inlined into one script and one stylesheet, which
// ../scripts/inline-html.mjs then folds into a single page.
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
