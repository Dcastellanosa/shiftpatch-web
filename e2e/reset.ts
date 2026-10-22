import { execFileSync } from 'node:child_process'
import { API_DIR } from './local.ts'

/**
 * Re-creates the local database from the migrations and seeds exactly the
 * trial dataset (`pnpm e2e:reset` in shiftpatch-api, password `Trial2026!`).
 * Every spec file calls it first, so no file ever observes another file's
 * changes to `shift-1..3`, the trial accounts or their eligibility.
 */
export function resetSeed(): void {
  execFileSync('pnpm', ['e2e:reset'], { cwd: API_DIR, env: process.env, stdio: ['ignore', 'inherit', 'inherit'] })
}
