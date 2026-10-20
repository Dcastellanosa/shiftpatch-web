// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { expect, it, vi } from 'vitest'
import { SessionContext, useSession } from './session-context.ts'

it('exposes the session supplied by its provider', () => {
  const value = { loading: false, authenticated: false, user: null, error: null, login: vi.fn(async () => {}), logout: vi.fn(async () => {}) }
  const wrapper = ({ children }: { children: ReactNode }) => <SessionContext value={value}>{children}</SessionContext>
  expect(renderHook(useSession, { wrapper }).result.current).toBe(value)
})
