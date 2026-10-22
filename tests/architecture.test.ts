import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(import.meta.dirname, '..')
const SRC = join(ROOT, 'src')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry) ? [path] : []
  })
}

const files = sourceFiles(SRC)
const offenders = (test: (source: string) => boolean) =>
  files.filter((file) => test(readFileSync(file, 'utf8'))).map((file) => relative(ROOT, file))

describe('the API client is the only network gateway', () => {
  it('only shared/api/client calls fetch', () => {
    expect(offenders((source) => /\bfetch\(/.test(source))).toEqual(['src/shared/api/client/client.ts'])
  })

  it('no source file carries an absolute http(s) URL', () => {
    expect(offenders((source) => /https?:\/\//.test(source))).toEqual([])
  })
})

describe('the access token lives only in the API client layer', () => {
  it('only the client and the token holder touch the token', () => {
    expect(offenders((source) => /setAccessToken|clearAccessToken|notifySessionLost/.test(source))).toEqual([
      'src/shared/api/client/client.ts',
      'src/shared/api/token/token.ts',
    ])
  })

  it('nothing restores a session from the server: a reload starts anonymous', () => {
    expect(offenders((source) => /auth\/me|getCurrentSession/.test(source))).toEqual([])
  })
})

describe('routing stays declarative', () => {
  it('uses react-router (declarative mode) and never the data router APIs', () => {
    expect(
      offenders((source) =>
        /react-router-dom|createBrowserRouter|createHashRouter|RouterProvider|useLoaderData|useActionData|createRoutesFromElements/.test(
          source,
        ),
      ),
    ).toEqual([])
  })

  it('declares no route loaders or actions', () => {
    expect(offenders((source) => /<Route\b[^>]*\b(loader|action)=/.test(source))).toEqual([])
  })
})

describe('one Zustand store', () => {
  it('creates exactly one store, in src/stores/ui-store', () => {
    expect(offenders((source) => /from 'zustand'/.test(source))).toEqual(['src/stores/ui-store/ui-store.ts'])
  })
})
