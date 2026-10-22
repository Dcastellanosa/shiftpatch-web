// @vitest-environment jsdom
import { screen, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { json, makeAuditEvent, stubApi } from '../../../tests/fake-api.ts'
import { renderWithProviders } from '../../../tests/render-with-providers.tsx'
import { AuditLogPage } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('shows the audit log table with actor, action, entity, change and reason', async () => {
  stubApi({
    'GET /api/admin/audit-events': () =>
      json(200, {
        events: [
          makeAuditEvent(),
          makeAuditEvent({
            id: 'e2',
            entityType: 'agency',
            entityId: 'agency-3',
            action: 'created',
            previousStatus: null,
            newStatus: 'active',
            reason: null,
            actorId: 'admin-1',
            actorName: 'Alex Kim',
          }),
        ],
      }),
  })
  const { container } = renderWithProviders(<AuditLogPage />, { path: '/admin/audit-log' })
  const table = await screen.findByTestId('audit-log-table')
  const rows = within(table).getAllByRole('row')
  expect(rows).toHaveLength(3)
  expect(rows[1]!.textContent).toContain('Maria Lopez')
  expect(rows[1]!.textContent).toContain('shift-2')
  expect(rows[1]!.textContent).toContain('No-show')
  expect(rows[1]!.textContent).toContain('no-show')
  expect(rows[2]!.textContent).toContain('Alex Kim')
  expect(container.firstChild).toMatchSnapshot()
})

it('shows an empty state and an error state with retry', async () => {
  stubApi({ 'GET /api/admin/audit-events': () => json(200, { events: [] }) })
  const { unmount } = renderWithProviders(<AuditLogPage />, { path: '/admin/audit-log' })
  expect(await screen.findByText('Nothing recorded yet')).toBeTruthy()
  unmount()

  stubApi({
    'GET /api/admin/audit-events': () => json(403, { error: 'You do not have permission to perform this action' }),
  })
  renderWithProviders(<AuditLogPage />, { path: '/admin/audit-log' })
  expect(await screen.findByText('Something went wrong')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Try Again' })).toBeTruthy()
})
