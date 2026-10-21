import type { PasswordLinkType } from '../../../shared/api/client/index.ts'

export interface PasswordLink {
  tokenHash: string
  type: PasswordLinkType
}

export const SET_PASSWORD_PATH = '/set-password'

const TOKEN_HASH = /^[A-Za-z0-9._~-]{16,512}$/
const TYPES: readonly PasswordLinkType[] = ['invite', 'recovery']

/** Parses `#token_hash=…&type=invite|recovery`. Returns null for anything else. */
export function parsePasswordLink(hash: string): PasswordLink | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  const tokenHash = params.get('token_hash') ?? ''
  const type = params.get('type') ?? ''
  if (!TOKEN_HASH.test(tokenHash)) return null
  const linkType = TYPES.find((candidate) => candidate === type)
  return linkType ? { tokenHash, type: linkType } : null
}

/**
 * Reads the link from the address bar exactly once and removes the fragment
 * from the URL, so the token is not kept in history, bookmarks or referrers.
 * The token lives only in component state until it is posted to the API.
 */
export function readPasswordLink(): PasswordLink | null {
  const link = parsePasswordLink(window.location.hash)
  if (window.location.hash) {
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
  }
  return link
}
