// @vitest-environment jsdom
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import {
  BRANCH_2_ID,
  BRANCH_ID,
  NURSE_ID,
  json,
  makeBranch,
  makeNurseEligibility,
  stubApi,
} from '../../../../tests/fake-api.ts'
import { renderWithProviders } from '../../../../tests/render-with-providers.tsx'
import { NurseEligibilityTable } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

const branches = [
  makeBranch(),
  makeBranch({ id: BRANCH_2_ID, name: 'Riverside Hospital' }),
  makeBranch({ id: 'b1000000-0000-4000-8000-000000000005', name: 'Lakeside Clinic', status: 'inactive' }),
]

it('shows one column per branch, a cell per nurse, and sends the change for the right pair', async () => {
  const fetchMock = stubApi({
    [`PUT /api/nurses/${NURSE_ID}/eligibility/${BRANCH_2_ID}`]: () =>
      json(200, { eligibility: { nurseId: NURSE_ID, branchId: BRANCH_2_ID, status: 'active', activatedAt: null } }),
  })
  const { container } = renderWithProviders(
    <NurseEligibilityTable nurses={[makeNurseEligibility()]} branches={branches} />,
  )
  const table = screen.getByTestId('eligibility-table')
  expect(
    within(table)
      .getAllByRole('columnheader')
      .map((th) => th.textContent),
  ).toEqual(['Nurse', 'Downtown Clinic', 'Riverside Hospital', 'Lakeside Clinic (inactive)'])
  expect(within(table).getByRole('button', { name: 'Suspend Ava Thompson at Downtown Clinic' })).toBeTruthy()
  expect(
    within(table).getByRole('button', { name: 'Activate Ava Thompson at Lakeside Clinic' }).hasAttribute('disabled'),
  ).toBe(true)
  expect(container.firstChild).toMatchSnapshot()

  await userEvent.click(within(table).getByRole('button', { name: 'Activate Ava Thompson at Riverside Hospital' }))
  expect(fetchMock).toHaveBeenCalledWith(
    `/api/nurses/${NURSE_ID}/eligibility/${BRANCH_2_ID}`,
    expect.objectContaining({ method: 'PUT' }),
  )
  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(BRANCH_ID).not.toBe(BRANCH_2_ID)
})
