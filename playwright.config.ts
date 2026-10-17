import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

// Optional local file for E2E settings (gitignored by `.env.*`). See README → End-to-end test.
if (existsSync('.env.e2e.local')) process.loadEnvFile('.env.e2e.local')

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:5173'

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Starts Vite (with its /api proxy) unless E2E_BASE_URL points elsewhere.
  // shiftpatch-api must already be running against a seeded database.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'pnpm dev --port 5173 --strictPort',
        url: baseURL,
        reuseExistingServer: true,
        timeout: 60_000,
      },
})
