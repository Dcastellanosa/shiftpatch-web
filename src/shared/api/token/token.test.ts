// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  authorizationHeaders,
  clearAccessToken,
  hasAccessToken,
  notifySessionLost,
  onSessionLost,
  setAccessToken,
} from './index.ts'

afterEach(() => {
  clearAccessToken()
  vi.restoreAllMocks()
})

describe('the in-memory token holder', () => {
  it('starts empty and sends no Authorization header', () => {
    expect(hasAccessToken()).toBe(false)
    expect(authorizationHeaders()).toEqual({})
  })

  it('exposes the token only as an Authorization header, and forgets it on clear', () => {
    setAccessToken('abc.def.ghi')
    expect(hasAccessToken()).toBe(true)
    expect(authorizationHeaders()).toEqual({ Authorization: 'Bearer abc.def.ghi' })
    clearAccessToken()
    expect(hasAccessToken()).toBe(false)
    expect(authorizationHeaders()).toEqual({})
  })

  it('never touches browser storage or cookies', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const cookie = vi.fn()
    Object.defineProperty(document, 'cookie', { set: cookie, get: () => '', configurable: true })
    try {
      setAccessToken('secret-token')
      authorizationHeaders()
      clearAccessToken()
      expect(setItem).not.toHaveBeenCalled()
      expect(cookie).not.toHaveBeenCalled()
      expect(localStorage.length).toBe(0)
      expect(sessionStorage.length).toBe(0)
    } finally {
      Reflect.deleteProperty(document, 'cookie')
    }
  })

  it('notifies session-lost listeners once each and lets them unsubscribe', () => {
    const first = vi.fn()
    const second = vi.fn()
    const stop = onSessionLost(first)
    onSessionLost(second)
    notifySessionLost()
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
    stop()
    notifySessionLost()
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(2)
  })
})
