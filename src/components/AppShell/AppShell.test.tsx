// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { SessionProvider } from '../../auth/SessionProvider/index.ts'
import { NURSE, json, stubApi } from '../../../tests/fake-api.ts'
import { AppShell } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('renders nurse navigation and account details', async () => {
  window.history.replaceState(null, '', '/shifts')
  stubApi({ 'GET /api/auth/me': () => json(200, { user: NURSE }) })
  const { container } = render(
    <SessionProvider>
      <AppShell role="nurse"><h1>Available Shifts</h1></AppShell>
    </SessionProvider>,
  )
  await screen.findByText('Ava Thompson')
  expect(container.firstChild).toMatchSnapshot()
})
