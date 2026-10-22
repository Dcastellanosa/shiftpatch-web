import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = join(import.meta.dirname, '..', 'src')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry) ? [path] : []
  })
}

/** The specification's test ids, verbatim. Each must sit on a rendered element of the required flow. */
export const REQUIRED_TEST_IDS = [
  'login-email-input',
  'login-password-input',
  'login-submit-button',
  'shift-list-item',
  'shift-claim-button',
  'shift-cancel-button',
  'credential-upload-input',
  'credential-expiry-date-input',
  'agency-post-shift-button',
  'agency-post-shift-submit-button',
  'admin-dashboard-shift-table',
  'admin-shift-status-badge',
  'audit-log-table',
  'timesheet-table',
  'notification-banner',
] as const

describe('the specification’s data-testid attributes', () => {
  const sources = sourceFiles(SRC).map((file) => readFileSync(file, 'utf8'))

  it.each(REQUIRED_TEST_IDS)('%s is attached in a source file', (id) => {
    const attached = sources.some(
      (source) =>
        source.includes(`data-testid="${id}"`) ||
        source.includes(`TestId="${id}"`) ||
        source.includes(`testId="${id}"`),
    )
    expect(attached).toBe(true)
  })
})
