// @vitest-environment jsdom
import { expect, it } from 'vitest'
import { parsePasswordLink, readPasswordLink } from './index.ts'

const TOKEN = 'pkce_0123456789abcdef'

it('accepts invite and recovery links and rejects anything else', () => {
  expect(parsePasswordLink(`#token_hash=${TOKEN}&type=invite`)).toEqual({ tokenHash: TOKEN, type: 'invite' })
  expect(parsePasswordLink(`#type=recovery&token_hash=${TOKEN}`)).toEqual({ tokenHash: TOKEN, type: 'recovery' })
  expect(parsePasswordLink(`#token_hash=${TOKEN}&type=magiclink`)).toBeNull()
  expect(parsePasswordLink('#token_hash=short&type=invite')).toBeNull()
  expect(parsePasswordLink(`#token_hash=${TOKEN}<script>&type=invite`)).toBeNull()
  expect(parsePasswordLink('')).toBeNull()
})

it('reads the link once and strips the fragment from the address bar', () => {
  window.history.replaceState(null, '', `/set-password?x=1#token_hash=${TOKEN}&type=invite`)
  expect(readPasswordLink()).toEqual({ tokenHash: TOKEN, type: 'invite' })
  expect(window.location.hash).toBe('')
  expect(window.location.pathname + window.location.search).toBe('/set-password?x=1')
  expect(readPasswordLink()).toBeNull()
})
