import { defineConfig } from 'vitest/config'

// Instant Hub's own tests only; berg-river has its own setup.
export default defineConfig({
  test: { include: ['src/**/*.test.{ts,tsx}'] },
})
