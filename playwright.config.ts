import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

/**
 * Fully local end-to-end suite. Every run:
 *   1. starts shiftpatch-api on :3100 against the local Supabase stack
 *      (`pnpm e2e:api` there: keys from `supabase status`, `.env` ignored),
 *   2. starts Vite on :5174 proxying /api to that API (your own dev server on :5173 can keep running),
 *   3. resets and seeds the local database with a throwaway password
 *      (`e2e/global-setup.ts`), then runs the specs in order on one worker.
 * Nothing here can reach a hosted project, and no password is configured.
 *
 * Optional `.env.e2e.local` (gitignored): E2E_API_DIR when shiftpatch-api is
 * not the sibling folder `../shiftpatch-api`.
 */
if (existsSync('.env.e2e.local')) process.loadEnvFile('.env.e2e.local')
// The seeded password is generated per run; a configured one is never used.
delete process.env.E2E_PASSWORD

import { API_DIR, API_PORT, WEB_ORIGIN } from './e2e/local.ts'

export default defineConfig({
  testDir: 'e2e',
  globalSetup: './e2e/global-setup.ts',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: { baseURL: WEB_ORIGIN, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'pnpm e2e:api',
      cwd: API_DIR,
      url: `http://localhost:${API_PORT}/health`,
      env: { E2E_API_PORT: String(API_PORT), E2E_WEB_ORIGIN: WEB_ORIGIN },
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: 'pnpm dev --port 5174 --strictPort',
      url: WEB_ORIGIN,
      env: { API_PROXY_TARGET: `http://localhost:${API_PORT}` },
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
})
