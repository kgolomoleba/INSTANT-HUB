import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/** Lists every built script and style file so the offline cache can save them all. */
const precacheManifest = (): Plugin => ({
  name: 'precache-manifest',
  generateBundle(_, bundle) {
    const files = Object.keys(bundle)
      .filter((f) => /^assets\/.*\.(js|css)$/.test(f))
      .map((f) => '/' + f)
    this.emitFile({ type: 'asset', fileName: 'precache.json', source: JSON.stringify(files) })
  },
})

export default defineConfig({
  plugins: [react(), precacheManifest()],
  build: {
    rollupOptions: {
      output: {
        // Libraries in their own files: they change rarely, so browsers keep
        // them cached across app updates.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          motion: ['framer-motion'],
        },
      },
    },
  },
})
