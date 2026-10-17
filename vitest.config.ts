import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    // Component tests opt into jsdom with a `@vitest-environment jsdom` docblock.
    environment: 'node',
    setupFiles: ['tests/setup.ts'],
  },
})
