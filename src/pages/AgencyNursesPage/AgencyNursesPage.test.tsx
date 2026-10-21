// @vitest-environment jsdom
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { BRANCH_ID, NURSE_ID, json, makeBranch, makeNurseEligibility, stubApi } from '../../../tests/fake-api.ts'
import { renderWithProviders } from '../../../tests/render-with-providers.tsx'
import { AgencyNursesPage } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('suspends a nurse and shows the refreshed status', async () => {
  let nurse = makeNurseEligibility()
  stubApi({
    'GET /api/branches': () => json(200, { branches: [makeBranch()] }),
    'GET /api/agency/nurses': () => json(200, { nurses: [nurse] }),
    [`DELETE /api/nurses/${NURSE_ID}/eligibility/${BRANCH_ID}`]: () => {
      nurse = makeNurseEligibility({ branches: [{ ...nurse.branches[0]!, status: 'suspended' }] })
      return json(200, {
        eligibility: { nurseId: NURSE_ID, branchId: BRANCH_ID, status: 'suspended', activatedAt: null },
      })
    },
  })
  renderWithProviders(<AgencyNursesPage />, { path: '/agency/nurses' })
  const table = await screen.findByTestId('eligibility-table')
  await userEvent.click(within(table).getByRole('button', { name: 'Suspend Ava Thompson at Downtown Clinic' }))
  expect(await within(table).findByText('Suspended')).toBeTruthy()
  expect(within(table).getByRole('button', { name: 'Activate Ava Thompson at Downtown Clinic' })).toBeTruthy()
})

it('shows the empty state and an error state with retry', async () => {
  stubApi({
    'GET /api/branches': () => json(200, { branches: [makeBranch()] }),
    'GET /api/agency/nurses': () => json(200, { nurses: [] }),
  })
  const { unmount } = renderWithProviders(<AgencyNursesPage />, { path: '/agency/nurses' })
  expect(await screen.findByText('No nurses yet')).toBeTruthy()
  unmount()

  stubApi({
    'GET /api/branches': () => json(200, { branches: [] }),
    'GET /api/agency/nurses': () => json(403, { error: { code: 'forbidden', message: 'Forbidden' } }),
  })
  renderWithProviders(<AgencyNursesPage />, { path: '/agency/nurses' })
  expect(await screen.findByText('Something went wrong')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Try Again' })).toBeTruthy()
})
