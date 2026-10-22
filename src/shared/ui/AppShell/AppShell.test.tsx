// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { NURSE, json, stubApi } from '../../../../tests/fake-api.ts'
import { renderWithProviders } from '../../../../tests/render-with-providers.tsx'
import { useUiStore } from '../../../stores/ui-store/index.ts'
import { AppShell } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

const shell = (
  <AppShell role="nurse">
    <h1>Available Shifts</h1>
  </AppShell>
)

it('renders nurse navigation and account details', async () => {
  stubApi({})
  const { container } = renderWithProviders(shell, { path: '/shifts', session: true, user: NURSE })
  await screen.findByText('Maria Lopez')
  const current = screen.getByRole('link', { name: 'Available Shifts' })
  expect(current.getAttribute('aria-current')).toBe('page')
  expect(current.className).toBe('nav__link')
  expect(container.firstChild).toMatchSnapshot()
})

it('shows queued notifications', async () => {
  stubApi({})
  renderWithProviders(shell, { path: '/shifts', session: true, user: NURSE })
  await screen.findByText('Maria Lopez')
  useUiStore.getState().pushToast({ kind: 'success', title: 'Shift claimed' })
  expect(await screen.findByText('Shift claimed')).toBeTruthy()
})

it('signs out through the API', async () => {
  const fetchMock = stubApi({ 'POST /api/auth/logout': () => json(204) })
  const { queryClient } = renderWithProviders(shell, { path: '/shifts', session: true, user: NURSE })
  await screen.findByText('Maria Lopez')

  await userEvent.click(screen.getByRole('button', { name: 'Sign Out' }))

  await vi.waitFor(() => expect(queryClient.getQueryData(['session'])).toBeNull())
  expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual(['/api/auth/logout'])
})
