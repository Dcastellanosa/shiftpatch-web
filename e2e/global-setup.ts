import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { API_DIR } from './local.ts'
import { resetSeed } from './reset.ts'

const LOOPBACK = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/

/**
 * Verifies the sibling API checkout and the local Supabase stack, resets and
 * seeds the database once (each spec file re-seeds again before it starts),
 * and locates the local Mailpit so the specs can read invitation and
 * recovery emails. Refuses anything non-local.
 */
export default function globalSetup() {
  const pkg = join(API_DIR, 'package.json')
  if (!existsSync(pkg) || (JSON.parse(readFileSync(pkg, 'utf8')) as { name?: string }).name !== 'shiftpatch-api') {
    throw new Error(
      `shiftpatch-api was not found at ${API_DIR}. Clone it next to this repo or set E2E_API_DIR in .env.e2e.local.`,
    )
  }

  const status = JSON.parse(
    execFileSync('supabase', ['status', '-o', 'json'], {
      cwd: API_DIR,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }),
  ) as Record<string, string | undefined>
  const mailUrl = status.MAILPIT_URL ?? status.INBUCKET_URL ?? ''
  if (!LOOPBACK.test(status.API_URL ?? '') || !LOOPBACK.test(mailUrl)) {
    throw new Error('Refusing to run end-to-end tests against a Supabase stack that is not local')
  }

  resetSeed()
  process.env.E2E_MAILPIT_URL = mailUrl
}
