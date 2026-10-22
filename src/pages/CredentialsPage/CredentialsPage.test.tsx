// @vitest-environment jsdom
import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { json, makeCredential, stubApi } from '../../../tests/fake-api.ts'
import { renderWithProviders } from '../../../tests/render-with-providers.tsx'
import { CredentialsPage } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('shows the upload form with the required inputs and the empty list', async () => {
  stubApi({ 'GET /api/me/credentials': () => json(200, { credentials: [] }) })
  const { container } = renderWithProviders(<CredentialsPage />, { path: '/credentials' })
  await screen.findByText('No credentials yet')
  expect(screen.getByTestId('credential-upload-input').getAttribute('type')).toBe('file')
  expect(screen.getByTestId('credential-expiry-date-input').getAttribute('type')).toBe('date')
  expect(container.firstChild).toMatchSnapshot()
})

it('lists credentials with their status', async () => {
  stubApi({
    'GET /api/me/credentials': () =>
      json(200, {
        credentials: [
          makeCredential(),
          makeCredential({ id: 'd2', type: 'tb_test', expiresAt: '2026-06-01', status: 'expired' }),
        ],
      }),
  })
  renderWithProviders(<CredentialsPage />, { path: '/credentials' })
  const table = await screen.findByTestId('credentials-table')
  expect(within(table).getByText('Nursing licence')).toBeTruthy()
  expect(within(table).getByText('TB test')).toBeTruthy()
  expect(within(table).getByText('Expired')).toBeTruthy()
  expect(within(table).getByText('Valid')).toBeTruthy()
})

it('uploads a file with its expiry date and refreshes the list', async () => {
  let credentials: ReturnType<typeof makeCredential>[] = []
  const fetchMock = stubApi({
    'GET /api/me/credentials': () => json(200, { credentials }),
    'POST /api/me/credentials': () => {
      credentials = [makeCredential()]
      return json(201, { credential: credentials[0] })
    },
  })
  renderWithProviders(<CredentialsPage />, { path: '/credentials' })
  await screen.findByText('No credentials yet')

  await userEvent.upload(
    screen.getByTestId('credential-upload-input'),
    new File(['%PDF-1.4'], 'licence.pdf', { type: 'application/pdf' }),
  )
  fireEvent.change(screen.getByTestId('credential-expiry-date-input'), { target: { value: '2028-01-01' } })
  await userEvent.click(screen.getByRole('button', { name: 'Upload credential' }))

  await vi.waitFor(() => expect(fetchMock.mock.calls.map(([, init]) => init?.method ?? 'GET')).toContain('POST'))
  expect(await screen.findByText('licence.pdf')).toBeTruthy()
  expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
    '/api/me/credentials',
    '/api/me/credentials',
    '/api/me/credentials',
  ])
})

it('shows an error state with retry when the list fails', async () => {
  stubApi({ 'GET /api/me/credentials': () => json(500, { error: 'Internal server error' }) })
  renderWithProviders(<CredentialsPage />, { path: '/credentials' })
  expect(await screen.findByText('Something went wrong')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Try Again' })).toBeTruthy()
})
