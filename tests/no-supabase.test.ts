import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(import.meta.dirname, '..')
const SRC = join(ROOT, 'src')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry) && !/\.test\.[jt]sx?$/.test(entry) ? [path] : []
  })
}

function dependencyNames(): string[] {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as Record<string, unknown>
  return Object.keys({
    ...(pkg.dependencies as object | undefined),
    ...(pkg.devDependencies as object | undefined),
  })
}

describe('BFF boundary: the frontend never talks to Supabase', () => {
  const files = sourceFiles(SRC)

  it('finds source files to check', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it('no source file imports or references Supabase', () => {
    const offenders = files
      .filter((file) => /supabase/i.test(readFileSync(file, 'utf8')))
      .map((file) => relative(ROOT, file))
    expect(offenders).toEqual([])
  })

  it('package.json has no Supabase dependency', () => {
    expect(dependencyNames().filter((name) => name.includes('supabase'))).toEqual([])
  })

  it('.env.example declares no VITE_SUPABASE_* variables', () => {
    expect(readFileSync(join(ROOT, '.env.example'), 'utf8')).not.toMatch(/VITE_SUPABASE/)
  })

  it('no source file reads browser storage', () => {
    const offenders = files
      .filter((file) => /\b(localStorage|sessionStorage|indexedDB|document\.cookie)\b/.test(readFileSync(file, 'utf8')))
      .map((file) => relative(ROOT, file))
    expect(offenders).toEqual([])
  })

  it('only the API client layer builds the Authorization header', () => {
    const offenders = files
      .filter((file) => /['"`]authorization['"`]|\bauthorization\s*:|\bbearer\s/i.test(readFileSync(file, 'utf8')))
      .map((file) => relative(ROOT, file))
      .filter((file) => !file.startsWith('src/shared/api/'))
    expect(offenders).toEqual([])
    const bearerBuilders = files
      .filter((file) => /Bearer \$\{/.test(readFileSync(file, 'utf8')))
      .map((file) => relative(ROOT, file))
    expect(bearerBuilders).toEqual(['src/shared/api/token/token.ts'])
  })

  it('no source file persists or logs the access token', () => {
    const offenders = files
      .filter((file) => /console\.(log|info|warn|error)\([^)]*token/i.test(readFileSync(file, 'utf8')))
      .map((file) => relative(ROOT, file))
    expect(offenders).toEqual([])
  })
})

describe('server state stays in memory', () => {
  const files = sourceFiles(SRC)

  it('package.json has no query persister', () => {
    expect(dependencyNames().filter((name) => /persist/i.test(name))).toEqual([])
  })

  it('no source file persists the query cache', () => {
    const offenders = files
      .filter((file) =>
        /persistQueryClient|PersistQueryClientProvider|create(Sync|Async)StoragePersister|query-persist-client/.test(
          readFileSync(file, 'utf8'),
        ),
      )
      .map((file) => relative(ROOT, file))
    expect(offenders).toEqual([])
  })
})
