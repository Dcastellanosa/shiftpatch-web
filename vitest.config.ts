import { defineConfig } from 'vitest/config'

// Snapshots contain formatted dates: pin the zone so they match on every
// machine and on the CI runner (UTC), not the developer's local offset.
process.env.TZ = 'UTC'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    // Component tests opt into jsdom with a `@vitest-environment jsdom` docblock.
    environment: 'node',
    setupFiles: ['tests/setup.ts'],
  },
})
