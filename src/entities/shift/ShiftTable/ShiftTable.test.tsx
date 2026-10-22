// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { makeShift } from '../../../../tests/fake-api.ts'
import { ShiftTable } from './index.ts'

it('renders a filled shift with the nurse holding it and the agency', () => {
  const shift = makeShift({ id: 'shift-2', role: 'LPN', status: 'filled', claimedBy: 'nurse-1' })
  const { container } = render(<ShiftTable shifts={[shift]} showAgency />)
  expect(screen.getByText('nurse-1')).toBeTruthy()
  expect(screen.getByText('Sunrise Health Staffing')).toBeTruthy()
  expect(container.firstChild).toMatchSnapshot()
})

it('marks an open shift as unassigned', () => {
  render(<ShiftTable shifts={[makeShift()]} />)
  expect(screen.getByText('Unassigned')).toBeTruthy()
})

it('carries the admin reporting test ids when asked, one badge per row', () => {
  render(
    <ShiftTable
      shifts={[makeShift(), makeShift({ id: 'shift-2', status: 'filled', claimedBy: 'nurse-1' })]}
      showAgency
      testId="admin-dashboard-shift-table"
      badgeTestId="admin-shift-status-badge"
    />,
  )
  expect(screen.getByTestId('admin-dashboard-shift-table').tagName).toBe('TABLE')
  expect(screen.getAllByTestId('admin-shift-status-badge').map((b) => b.textContent)).toEqual(['Open', 'Filled'])
})

it('renders row actions from the slot', () => {
  render(
    <ShiftTable shifts={[makeShift()]} renderActions={(shift) => <button type="button">Act on {shift.id}</button>} />,
  )
  expect(screen.getByRole('button', { name: 'Act on shift-1' })).toBeTruthy()
})
